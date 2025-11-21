# TipTap Text Editor Implementation

## Overview

The Balsamiq wireframe editor uses [TipTap](https://tiptap.dev/), a headless rich-text editor framework built on top of ProseMirror, to provide rich text editing capabilities within wireframe controls. TipTap provides a powerful, extensible architecture that allows us to implement complex text formatting features while maintaining full control over the rendering and behavior.

### Text Editor Positioning

**Important architectural note:** The text editor appears on top of the control's text and is positioned to blend seamlessly with the control's graphics. However, it is not actually part of the control - it's a separate, independent layer that overlays the control during text editing. This separation allows for:

- Rich text editing without modifying the control's rendering pipeline
- Consistent editing experience across different control types
- Clean separation between model (control) and editing UI (TipTap layer)

### Text Commit and Control Update

The control being edited is updated when text is committed in the following scenarios:

**Keyboard Commit:**

- **Single-line controls**: Press `Enter` to commit changes
- **Multi-line controls**: Press `Cmd+Enter` (Mac) or `Ctrl+Enter` (Windows/Linux) to commit changes

**Selection Change:**

- Clicking on the canvas to select a different control automatically commits the current text changes

When editing ends, the text content is saved back to the control's model as TextDom in the `jsonText` property, and the control re-renders with the updated text.

## Architecture

### Key Components

#### 1. TextEditRendering Class (`js/web/common/text-editing/text-edit-rendering.ts`)

The main class that manages the TipTap editor instance and handles all text editing operations. It extends `BaseRenderer` and provides:

- Editor lifecycle management (create, update, destroy)
- Text formatting state detection
- Command execution (bold, italic, colors, links, etc.)
- Integration with the Balsamiq data model

#### 2. TextEditControlBarView Component (`js/web/editor/views/text-edit-control-bar-view/text-edit-control-bar-view.tsx`)

The control bar component that provides the UI for controlling the TipTap editor. Like the text editor itself, this is a separate overlay component positioned above the control. It renders as a floating toolbar above the text editor and includes:

- **Format buttons**: Bold, Italic, Underline, Strikethrough
- **Font size selector**: Dropdown with preset sizes
- **Text alignment**: Left, Center, Right buttons
- **Bullet list toggle**: Enable/disable bullet lists
- **Link creation/editing**: Create and edit hyperlinks
- **Color picker**: Text color selection with selection preservation

**Key Features:**

- **Selection Preservation**: When the color picker opens, the text selection is saved and remains visually highlighted even when focus moves away from the editor
- **Real-time State Updates**: Formatting state is synchronized from the editor via `onFormattingStateChanged` callback
- **Blur Suspension**: Can suspend the editor's blur handler to keep it active while interacting with the control bar
- **Link Management**: Provides a dropdown dialog for creating/editing links with different action types (web address, wireframe navigation, etc.)

**Communication Flow:**

```
TextEditControlBarView
    ↓ (user clicks format button)
onTextLayerAction(TextActions.SET_BOLD, { value: true })
    ↓
TextEditLayerInPlace.setTextAction()
    ↓
TextEditRendering.setBold(true)
    ↓
TipTap Editor Command Execution
    ↓
onFormattingStateChanged() callback
    ↓
TextEditControlBarView state update (button appears pressed)
```

#### 3. Data Model Conversion and Persistence

**TipTap JSON ↔ TextDom Conversion** (`js/web/common/text-editing/tiptap-utils.ts`)

The editor maintains bidirectional conversion between:

- **TipTap JSON format**: ProseMirror's native document structure
- **TextDom format**: Balsamiq's internal text representation

```typescript
// Balsamiq TextDom format
type TextDomElement = {
    type: string;
    children: TextDomElementOrString[];
    // ... formatting properties
};

// TipTap JSON format
type TipTapDocument = {
    type: "doc";
    content: Array<TipTapNode>;
};
```

**Data Persistence Strategy**

Text content is now persisted directly as **TextDom** in the control's `jsonText` property, replacing the previous markdown-based approach:

**Previous approach (deprecated):**

- Text saved as markdown string in the `text` property
- Limited formatting support - markdown couldn't represent all style combinations
- Required lossy conversion between rich formatting and markdown syntax

**Current approach:**

- Text saved as TextDom structure in the `jsonText` property
- Provides complete formatting freedom - supports any combination of styles
- Preserves all formatting details: font sizes, colors, underlines, links with custom actions, etc.
- No lossy conversions - what you edit is exactly what gets saved

#### 4. Custom TipTap Extensions (`js/web/common/text-editing/tiptap-extensions.ts`)

Custom extensions that integrate Balsamiq-specific features:

- **LinkWithStyle**: Links with custom styling and actions
- **TextStyleExtended**: Extended text styling with fontSize and color
- **SvgNode/PathNode**: Embedded icon support
- **NoNestedBulletList**: Bullet list without nesting
- **UnderlineMark**: Underline text decoration
- **SpanMark**: Generic span wrapper for inline styles
- **PreventEnterExtension**: Single-line mode support

## Text Formatting State Detection

### The `getCurrentFormattingState()` Method

This is the core method that analyzes the current editor state to determine which formatting options are active. It returns a `TextFormattingState` object containing:

```typescript
type TextFormattingState = {
    isBold: boolean;
    isItalic: boolean;
    isStrikeThrough: boolean;
    isUnderline: boolean;
    isLink: boolean;
    containsLink: boolean;
    fontSize?: number; // undefined = mixed values
    color?: string; // undefined = mixed values
    textAlign: TextAlign;
    isBulletList: boolean;
};
```

### Formatting Detection Logic

#### Cursor Position (No Selection)

When the cursor is at a single position without a selection:

- Checks marks at the cursor position
- Returns the specific mark values (fontSize, color)
- Falls back to default control values if no marks present

#### Text Selection

When text is selected, the method performs a sophisticated analysis:

1. **Scans all text nodes** in the selection using `state.doc.nodesBetween()`
2. **Collects unique values** for fontSize and color into Sets
3. **Tracks coverage** by counting:
    - Total text nodes in selection
    - Text nodes with fontSize marks
    - Text nodes with color marks

4. **Determines final values**:
    - **Uniform formatting**: If all nodes have the same value → return that value
    - **No formatting**: If no nodes have marks → return default value
    - **Mixed/Partial**: If multiple values OR incomplete coverage → return `undefined`

#### Early Termination Optimization

For performance, scanning stops early when both fontSize and color are confirmed to have multiple different values:

```typescript
// Early termination: if both have multiple different values, stop scanning
if (fontSizes.size > 1 && colors.size > 1) {
    return false; // Stop iteration
}
```

### Helper Method: `getMarkValue()`

A reusable generic method that encapsulates the logic for determining mark values:

```typescript
private getMarkValue<T>(
    markValues: Set<T>,
    nodesWithMark: number,
    totalNodes: number,
    defaultValue: T,
): T | undefined {
    if (markValues.size === 1 && nodesWithMark === totalNodes) {
        return markValues.values().next().value; // Uniform
    } else if (markValues.size === 0) {
        return defaultValue; // No marks
    }
    return undefined; // Mixed or partial
}
```

## Key Features

### 1. Rich Text Formatting

- **Bold, Italic, Underline, Strikethrough**: Standard text decorations
- **Font Size**: Per-character font size control
- **Text Color**: RGB/Hex color support with theme integration
- **Text Alignment**: Left, Center, Right alignment
- **Bullet Lists**: Non-nested bullet list support

### 2. Link Support

- **Interactive Links**: Clickable links with custom actions
- **Link Actions**: Special behaviors (duplicate mockup, new mockup)
- **Link Styling**: Custom colors with theme support
- **Smart Cursor Handling**: Automatic link mark clearing when typing at link boundaries

### 3. Icon Integration

- **Inline Icons**: Font Awesome icons rendered as inline SVG nodes
- **Dynamic Sizing**: Icons scale with surrounding text fontSize
- **Color Matching**: Icons inherit text color
- **Link-aware**: Special handling for icons inside links

### 4. Paste Filtering

Custom paste handler that filters unsupported formatting:

```typescript
const pasteHandlerExtension = Extension.create({
    name: "customPasteHandler",
    // Filters pasted content through TextDom conversion
    // Removes unsupported elements (like font size from external sources)
});
```

### 5. Selection Preservation

When the color picker or other control bar elements take focus, the editor's text selection is preserved both programmatically and visually:

**Programmatic Preservation:**

```typescript
// When control bar element opens (e.g., color picker)
suspendHandleBlur(true) → saveSelection()

// When color is applied
setColor(color) → restoreSelection() → apply color
```

**Visual Preservation:**

- Custom CSS overrides ProseMirror's default selection hiding
- `ProseMirror-hideselection` class is actively removed by a plugin
- Selection remains highlighted with `#b3d7ff` background color
- Cursor is hidden when editor is not focused to avoid confusion

This ensures users can see exactly what text will be affected by their color choice.

### 6. Read-Only Mode

Keyboard handler that allows selection and copying but prevents editing:

- Allows: Copy (Ctrl/Cmd+C), Select All (Ctrl/Cmd+A), Navigation keys
- Prevents: All editing operations (typing, paste, delete)

### 7. Contrasting Background Color

Automatically calculates a contrasting background color based on the text colors in the editor:

**Algorithm:**

1. Collects all text colors (both inline marks and control color)
2. Converts colors to LAB color space for perceptually accurate lightness measurement
3. Calculates median lightness value (L component: 0=darkest, 100=lightest)
4. Returns contrasting background:
    - Median > 50 (light text) → Black background (`#000000`)
    - Median ≤ 50 (dark text) → White background (`#ffffff`)

**Control Color Handling:**

- Only included in calculation when text nodes exist without explicit color marks
- Ensures control color is only considered when actually affecting visible text

This provides better readability when editing text with light colors on light backgrounds or vice versa.

### 8. Line Height Management

Sophisticated line-height calculation for mixed font sizes:

```typescript
private updateParentFontSizeToMinimum() {
    // Sets parent container to minimum font size
    // Ensures line-height is calculated correctly
    // Larger text naturally increases line height
}
```

## Event Flow

### Editor Lifecycle

```
User Action
    ↓
TipTap Event (onCreate, onUpdate, onSelectionUpdate)
    ↓
TextEditRendering Handler
    ↓
Update Internal State (lastTextDom, cursorCoords, formattingState)
    ↓
Callback to ViewController (onTextChanged, onFormattingStateChanged)
    ↓
Update UI Elements (TextEditControlBarView buttons, color picker, etc.)
```

### Text Changes

```
User Types/Edits in Editor
    ↓
onEditorUpdate()
    ↓
exportTipTapEditorToTextDomString() - Convert TipTap JSON → TextDom
    ↓
getCurrentFormattingState() - Analyze current marks
    ↓
updateParentFontSizeToMinimum() - Adjust line heights
    ↓
onTextChanged(textDom, cursorPos, formattingState) - Notify UI
    ↓
TextEditControlBarView updates button states
    ↓
Operation created to update model
```

### Format Button Click (Control Bar → Editor)

```
User Clicks Bold Button in TextEditControlBarView
    ↓
handleBold(value) - Local handler
    ↓
onTextLayerAction(TextActions.SET_BOLD, { value })
    ↓
TextEditLayerInPlace.setTextAction()
    ↓
TextEditRendering.setBold(value)
    ↓
editor.chain().focus().setBold().run() - TipTap command
    ↓
onFormattingStateChanged() - Callback triggered
    ↓
TextEditControlBarView re-renders with updated state
```

### Color Picker Interaction (Selection Preservation)

```
User Selects Text in Editor
    ↓
User Clicks Color Picker
    ↓
onOpenChange(true) - Color picker opening
    ↓
suspendTextLayerHandleBlur(true) - Suspend blur handling
    ↓
TextEditRendering.saveSelection() - Save selection state
    ↓
Color Picker Opens (gains focus, but selection stays visible via CSS)
    ↓
User Picks Color
    ↓
handleColorPicked(intColor)
    ↓
TextEditRendering.setColor(color)
    ↓
TextEditRendering.restoreSelection() - Restore saved selection
    ↓
editor.chain().focus().setColor(color).run() - Apply color
    ↓
onFormattingStateChanged() - Update UI
```

## Technical Considerations

### 1. Null vs Undefined Handling

Color attributes can be `null` in addition to `undefined`. All checks must handle both:

```typescript
if (colorMark?.attrs?.color !== undefined && colorMark.attrs.color !== null) {
    colors.add(colorMark.attrs.color);
}
```

### 2. Position Resolution

ProseMirror positions are between characters, not at characters:

- Position 0: Before first character
- Position 1: After first character
- Special handling for cursor at position 0

### 3. Mark Storage

Marks can be stored in two places:

- `textStyle` mark: Contains `fontSize` and sometimes `color`
- `color` mark: Contains `color` (preferred for color)

The code checks both locations to ensure compatibility.

### 4. Context Menu Support

Custom context menu handler that stops propagation but allows default browser behavior:

```typescript
private handleContextMenu = (view: any, event: MouseEvent) => {
    event.stopPropagation();
    // Do NOT prevent default - we want the browser context menu
    return false;
};
```

### 5. Right-Aligned Text Expansion

Uses ResizeObserver to simulate leftward expansion for right-aligned auto-sized text:

```typescript
// When text grows, it expands to the left instead of right
mainDiv.style.transform = `translateX(-${widthDiff}px)`;
```

## Configuration

### Editor Extensions

```typescript
const extensions = [
    StarterKit.configure({
        // Disable unwanted features
        bulletList: false,
        heading: false,
        // ...
    }),
    Bold,
    Italic,
    Strike,
    Code,
    NoNestedBulletList,
    LinkWithStyle,
    TextStyleExtended,
    Color,
    SvgNode,
    UnderlineMark,
    SpanMark,
    keydownHandlerExtension,
    pasteHandlerExtension,
    maxLengthExtension, // Optional
];
```

### Editor Props

```typescript
{
    editable: true,
    extensions: extensions,
    content: jsonContent,
    enableContentCheck: true,
    editorProps: {
        attributes: {
            class: 'balsamiq-editor',
            dir: 'auto', // Auto RTL/LTR detection
        },
    },
    onCreate: this.onEditorCreate.bind(this),
    onUpdate: (props) => this.onEditorUpdate(props),
    onSelectionUpdate: this.onEditorSelectionUpdate.bind(this),
}
```

## Testing

Test file: `js/web/common/text-editing/text-edit-rendering.spec.ts`

Key test scenarios:

- **Mixed formatting detection**: Multiple font sizes/colors → `undefined`
- **Uniform formatting detection**: Single value across selection → that value
- **Partial coverage detection**: Mark doesn't span entire selection → `undefined`
- **Empty selection detection**: No marks present → default value
- **Null handling**: Color attributes can be `null`

## Performance Optimizations

1. **Early Termination**: Stop scanning when both fontSize and color are mixed
2. **Minimal DOM Updates**: Only dispatch transactions when document changes
3. **Paragraph-level Font Scanning**: Only scan first-level paragraphs for line-height
4. **Cached Text Conversion**: Store `lastTextDom` to avoid redundant conversions

## Future Enhancements

Potential improvements:

- Support for nested bullet lists
- Additional text decorations (subscript, superscript)
- Custom keyboard shortcuts
- Improved accessibility (ARIA labels)
- Undo/redo visualization
- Collaborative editing support

## References

- [TipTap Documentation](https://tiptap.dev/)
- [ProseMirror Documentation](https://prosemirror.net/)
- [ProseMirror Guide](https://prosemirror.net/docs/guide/)
- Source files:
    - `js/web/common/text-editing/text-edit-rendering.ts` - Main editor class
    - `js/web/editor/views/text-edit-control-bar-view/text-edit-control-bar-view.tsx` - Control bar UI component
    - `js/web/common/controls/text-edit-layer-in-place.tsx` - Text layer wrapper component
    - `js/web/common/text-editing/tiptap-utils.ts` - Data conversion utilities
    - `js/web/common/text-editing/tiptap-extensions.ts` - Custom TipTap extensions
    - `js/web/common/text-editing/text-edit-rendering.spec.ts` - Test suite
