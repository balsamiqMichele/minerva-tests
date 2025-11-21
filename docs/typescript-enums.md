# How to use enums in our code

Enums should solve the problem of defining a range of allowed values for a quantity.
We found that it is difficult to make them live with the existing Javascript definitions in the form of constants POJOs.
Since enums are a source of concern, our recommendation is to use the "const" approach for Javascript and then export a typescript type in this way

```ts
export const USER_ROLE_IN_PROJECT = {
    ADMIN: "ADMIN",
    EDITOR: "EDITOR",
    COMMENTER: "COMMENTER",
    VIEWER: "VIEWER",
    NO_ACCESS: "NO_ACCESS",
} as const;

export type USER_ROLE_IN_PROJECT = (typeof USER_ROLE_IN_PROJECT)[keyof typeof USER_ROLE_IN_PROJECT];
```
