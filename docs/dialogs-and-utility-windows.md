# Dialogs and Utility Windows Architecture

This document describes how dialogs and utility windows work in the Balsamiq wireframe editor, focusing on the rendering implementation in `js/web/common/views/windowview.tsx` and the utility window system.

## Overview

The application uses two distinct window management systems:

1. **Modal Dialogs**: For task-specific interactions that require user attention
2. **Utility Windows**: For persistent tools and panels that can float alongside the main interface

## Dialog System Architecture

### Dialog Portal Provider

The dialog system uses a portal-based architecture to ensure proper z-index layering:

```typescript
// WindowView provides a portal container for all dialogs
<DialogPortalProvider container={dialogsLayerPortal.current}>
```

The `DialogPortalProvider` from `/js/web/components/domain/dialog.tsx` manages where dialog content gets rendered, ensuring dialogs appear above other UI elements.

### Layer-Based Dialog Rendering

Dialogs are created from "layers" - objects that implement the `Layer` interface:

```typescript
type Layer = {
    id: string;
    onKeyboardEvent: (event: KeyboardEvent) => void;
    shouldRenderFullWindow: (isFirstLayer: boolean) => boolean;
    shouldAlwaysRenderLayer: () => boolean;
    makeReactElement: () => React.ReactNode;
    wantsFocus: () => boolean;
    handleClose: () => void;
    title: () => React.ReactNode;
    description: () => string;
    resizable?: () => boolean;
    startSize?: () => { width: number; height: number; maxWidth?: number; maxHeight?: number; onResize?: (width: number, height: number) => void };
    startPosition?: () => { x: number; y: number };
    minSize?: () => { width: number; height: number };
    renderWholeReactElement?: () => boolean;
    focus?: () => void;
    closable?: () => boolean;
};
```

### Dialog Features

- **Movable**: Dialogs can be dragged by their header
- **Resizable**: Optional resize handles in the bottom-right corner
- **Modal**: Prevent interaction with underlying content
- **Focus Management**: Automatic focus handling and restoration
- **Keyboard Events**: Proper event handling and propagation

### LayerDialog Component

The `LayerDialog` component in `windowview.tsx` handles:

- **Window Resizing**: Automatically adjusts dialog size when window is resized
- **Positioning**: Centers dialogs and prevents them from going off-screen
- **Size Constraints**: Respects minimum and maximum size requirements
- **Drag and Drop**: Implements movable dialogs via the `useMove` hook
- **Resize Handles**: Provides resize functionality via the `useResize` hook
- **Modal Behavior**: Controls whether dialog is modal based on `isModal` prop (defaults to true, set to false when utility windows are present)

## Utility Window System

Utility windows are persistent floating panels that provide tools and information. They are managed separately from modal dialogs and can optionally stay visible even when modal dialogs are open.

### Utility Window Types

Based on the codebase analysis, the following utility windows are implemented:

1. **Contact Support** (`js/editor/tasks/webcontactsupport.ts`)
    - **Special Property**: Only utility window that can stay in front of modal dialogs (`isInFront: true`)
    - **Purpose**: Customer support contact form
    - **Size**: 360×375 minimum
    - **Position**: Top-right of parent window

2. **Search Documentation** (`js/editor/tasks/websearchdocumentation.ts`)
    - **Purpose**: Search Balsamiq documentation
    - **Size**: 360×375 minimum
    - **Position**: Bottom-right of parent window

3. **Font and Colors** (`js/editor/tasks/webfontandcolors.ts`)
    - **Purpose**: Font and color selection panel
    - **Size**: 360×268 minimum, fixed size
    - **Position**: Centered, non-resizable
    - **Resizable**: No (`canResize: false`)

4. **Find and Replace** (`js/editor/tasks/webfindandreplace.ts`)
    - **Purpose**: Text search and replace functionality
    - **Size**: 550×125 (without replace) / 550×225 (with replace) minimum
    - **Position**: Centered in upper half of parent window
    - **Resizable**: No (`canResize: false`)
    - **Special**: Can reconfigure existing window instead of opening new one

### Utility Window Architecture

#### OpenUtilityWindowContext

All utility windows are opened through the `openUtilityWindowInternal` function with a context:

```typescript
type OpenUtilityWindowContext = {
    host: iUtilityWindowHost;
    parentWindowID?: string;
    settings: SettingsInterface;
    runMainTask: (windowID: string, task: Task, callback: (res?: unknown) => void) => void;
    isInFront?: boolean; // Only Contact Support uses this
};
```

### Utility Window Rendering in WindowView

In `windowview.tsx`, utility windows are rendered in two layers based on dialog presence and full window layer state:

```typescript
// Utility windows positioning logic
const hasDialogs = children.length > 0 && children[children.length - 1].type === LayerDialog;
const hasFullWindowTopLayer = layers.length > 0 && layers[layers.length - 1].shouldRenderFullWindow(layers.length === 1);

const [utilityWindowsElementsBack, utilityWindowsElementsFront] = utilityWindows.reduce<[JSX.Element[], JSX.Element[]]>(
    (acc, utilityWindow) => {
        if (hasFullWindowTopLayer || (hasDialogs && utilityWindow.isInFront)) {
            // Put above dialogs layer or above full window top layer
            return [
                acc[0],
                acc[1].concat(
                    <div id={`utilitywindow-container-${utilityWindow.id}`} key={`utilityWindow-${utilityWindow.id}`}>
                        {utilityWindow.makeReactElement()}
                    </div>,
                ),
            ];
        }

        // Put below dialogs layer
        const element = (
            <div id={`utilitywindow-container-${utilityWindow.id}`} key={`utilityWindow-${utilityWindow.id}`}>
                {utilityWindow.makeReactElement()}
            </div>
        );
        return [acc[0].concat(element), acc[1]];
    },
    [[], []],
);
```

#### Utility Window Positioning Rules

1. **When `hasFullWindowTopLayer` is true**: ALL utility windows go to the front layer, regardless of their `isInFront` property
2. **When there are modal dialogs but no full window top layer**: Only utility windows with `isInFront: true` go to the front layer
3. **When there are no dialogs and no full window top layer**: All utility windows go to the back layer

#### Full Window Top Layer Detection

The `hasFullWindowTopLayer` condition checks if:

- There is at least one layer present (`layers.length > 0`)
- The topmost layer (last in the array) returns `true` for `shouldRenderFullWindow(layers.length === 1)`

This is particularly important for the **Open Project Dialog** scenario where:

- The dialog is rendered as a full window layer
- Utility windows (like Contact Support) need to appear in front of the full window
- This ensures users can access support even when the full window dialog is open

The rendering order is:

1. Main content layers
2. **Utility windows (back)** - Behind dialogs and full windows
3. **Dialog overlay** - Background overlay for non-modal dialogs when utility windows are present
4. **Dialog portal** - Modal/non-modal dialogs
5. **Utility windows (front)** - Contact Support when `isInFront: true` OR all utilities when `hasFullWindowTopLayer: true`
6. Tooltips and other overlays

## Z-Index Management

The system maintains proper layering through strategic DOM placement:

```html
<div id="cursorLayer">
    <BalsamiqDragLayer /> <!-- Drag previews -->
    <div><!-- Main content layers --></div>
    <div id="utility-windows-behind"><!-- Most utility windows --></div>
    <!-- Custom overlay for non-modal dialogs when utility windows are present -->
    <div data-test-id="dialog-overlay-for-utility-windows" class="pointer-events-auto fixed inset-0 z-50 bg-black/80" />
    <div data-test-id="dialogLayerPortal" /><!-- Modal dialogs --></div>
    <div id="utility-windows-front"><!-- Contact Support and others when full window layer --></div>
    <Tooltip />
</div>
```

## Key Implementation Files

- **`js/web/common/views/windowview.tsx`**: Main rendering logic for dialogs and utility windows
- **`js/web/components/domain/dialog.tsx`**: Dialog component system with portal support
- **`js/web/editor/utilitywindows/webutilitywindow.ts`**: Utility window management utilities
- **`js/editor/tasks/web*.ts`**: Individual utility window implementations

## Dialog and Utility Window Interaction

### Non-Modal Dialog Behavior with Utility Windows

When utility windows are present, dialogs are rendered as **non-modal** to prevent blocking utility window interactions:

1. `LayerDialog` receives `isModal={utilityWindows.length === 0}` prop (line 388 in `windowview.tsx`)
2. When `isModal` is false, dialogs don't block interaction with utility windows
3. A custom background overlay (`dialog-overlay-for-utility-windows`) simulates modal appearance while preserving utility window functionality

### Contact Support Special Behavior

The Contact Support utility window has unique positioning behavior:

1. Setting `isInFront: true` in the utility context allows it to appear above regular dialogs
2. The rendering logic in WindowView checks `utilityWindow.isInFront` to determine placement
3. Only utility windows with `isInFront: true` are rendered in the front layer when dialogs are present

This ensures users can always access support even when modal dialogs are present.

### Additional Full Window Top Layer Behavior

Since the introduction of `hasFullWindowTopLayer`, ALL utility windows (including Contact Support) are placed in the front layer when:

- The topmost layer is a full window layer (like the Open Project Dialog)
- This overrides the individual `isInFront` property behavior
- Ensures all utility windows remain accessible when full window layers are active

This behavior is particularly important in `/projects` views where the Open Project Dialog is rendered as a full window and users still need access to utility windows like Contact Support and Search Documentation.

## Known Issues

### Escape Key Behavior with Utility Windows and Modal Dialogs

**Issue**: When a utility window is positioned on top of a modal dialog and the utility window has focus, pressing the ESC key closes the underlying modal dialog instead of the focused utility window.

**Root Cause**: This behavior is due to Radix UI's `onEscapeKeyDown` event handling mechanism. According to Radix documentation, the Dialog component's escape key handler follows the WAI-ARIA design pattern where ESC "closes the dialog and moves focus to the trigger." Even when utility windows are rendered as non-modal dialogs to allow interaction, the escape key event still propagates to and closes the underlying modal dialog.

**Technical Details**:

- Utility windows use `modal={false}` in their `DialogRoot` to prevent blocking interactions
- Modal dialogs beneath still capture escape key events due to Radix's event handling hierarchy
- The `onEscapeKeyDown` callback in `Dialog.Content` is triggered regardless of focus location

**Impact**:

- Users expect ESC to close the currently focused utility window
- Instead, ESC unexpectedly closes the background modal dialog
- This can cause loss of work or disrupt the user's workflow

**Workaround**: Currently, users must click the close button (×) on utility windows instead of using the ESC key when modal dialogs are present underneath.
