# TSON-DB

TSON-DB is a specialized DBMS for file-based databases. The database schema is defined in TypeScript using type functions. With options provided in these functions, a graphical user interface is generated that can be accessed through a browser.

TSON-DB can also be used to render type declarations in multiple languages or vocabularies like TypeScript (as actual types) or JSON Schema for the defined schema, but custom renderers can also be defined and used to support any output you need.

## Installation

```sh
npm install tsondb
```

## Configuration

To configure `tsondb`, create a configuration file at the location from where you are going to run its commands, usually the project root. The following file names are possible and are checked in the given order:

1. `tsondb.config.mts`
2. `tsondb.config.ts`
3. `tsondb.config.mjs`
4. `tsondb.config.js`

You need to export an object conforming to the `Config` type as the default export.

```ts
// tsondb.config.ts
import { join } from "node:path"
import { type Config, Schema } from "tsondb"
import { JsonSchemaOutput } from "tsondb/renderer/jsonschema"
import { TypeScriptOutput } from "tsondb/renderer/ts"

export default {
  schema: new Schema(
    [
      // add your entities here
    ]
  ),
  outputs: [
    TypeScriptOutput({
      targetPath: join(import.meta.dirname, "gen", "ts"),
    }),
    JsonSchemaOutput({
      targetPath: join(import.meta.dirname, "gen", "schema"),
    }),
  ],
  dataRootPath: join(import.meta.dirname, "data"),
} satisfies Config
```

See the following sections for details on how the different parts come together.

## Terms

The following list will define common terms used in TSONDB.

- **Entity:** The type of group of values, e.g. employees.
- **Instance:** A singular group of values of an *entity*, e.g. Jane Doe.

## Define a Schema

You define a schema by declarations that consist of types.

```ts
import { Entity, Object, Required, String } from "tsondb/schema/def"

const User = Entity(import.meta.url, {
  name: "User",
  namePlural: "Users",
  comment: "A user in the application.",
  type: () => Object({
    name: Required({
      comment: "The user’s full name.",
      type: String({ minLength: 1 }),
    }),
  }),
})
```

This defines a user entity with a single property called `name`. Its type is a non-empty string.

You can see how constraints are added by passing an object to the type function. This is a pattern used throughout. When a type is generic, like `Array` or `Object`, the option parameter is usually the second.

You can also add comments that, while not displayed by IDEs during the development of the schema, are used when generating outputs.

Note that some imports may shadow global objects (like `String` and `Object` in the example above). If you need a different name for an import, instead renaming an import, you can import a longer version of all declaration and type functions &mdash; declarations have a `Decl` suffix (e.g. `EntityDecl`) and types have a `Type` suffix (e.g. `StringType`). The simple imports are preferred due to simplicity, but you can also always use the suffixed names if you prefer to not shadow global objects.

Make sure to always pass `import.meta.url` as the first parameter to each declaration function, otherwise some functionality will not work at all or will not work as expected.

To actually add `Ùser` to your schema, either list it in the array passed to the `Schema` function or reference it in an entity that is already listed.

### Available Declarations

#### `Entity` or `EntityDecl`

Each entity has to be an object (and so the `type` option always has to return an `Object` type) and its instances have their own directory within the database root. TSON-DB automatically sets an `id` property on the object, so you cannot define an `id` by yourself. The identifier is a UUID that is also reflected in the instance’s file name.

#### `Enum` or `EnumDecl`

An enumeration consists of one or more cases that are defined using `EnumCase` (or `EnumCaseDecl`) declarations. In the database files, they are represented using a discriminator property.

#### `TypeAlias` or `TypeAliasDecl`

With a type alias you can give another type a descriptive name in generated outputs. Note that this is different from just assigning a type to a variable and using it. If you use a variable directly, it is merged into the declaration when generating outputs.

### Available Types

#### `Array` or `ArrayType`

An array type where you can define length and uniqueness constraints.

#### `Enum` or `EnumType`

You do not use this type directly, it is used internally and is only exported if you want to write your output renderer.

#### `Object` or `ObjectType`

An object type where you can define length constraints. Use in conjunction with the `Required` and `Optional` functions for defining object properties.

#### `Boolean` or `BooleanType`

A boolean type. This is not configurable.

#### `Date` or `DateType`

A date type where you can define whether to include time or not.

#### `Float` or `FloatType`

A floating-point number type with bound and factor constraints.

#### `Integer` or `IntegerType`

An integer type with bound and factor constraints.

#### `String` or `StringType`

A string type with length and pattern constraints.

#### `GenericArgumentIdentifier` or `GenericArgumentIdentifierType`

A type that references a type argument. Only useful with generic declarations (see *Type Parameters (Generics)* below).

#### `IncludeIdentifier` or `IncludeIdentifierType`

A type that references a type alias. There is a `Gen` version to reference generic type aliases (see *Type Parameters (Generics)* below).

#### `NestedEntityMap` or `NestedEntityMapType`

A keyed dictionary type where the keys are references to instances of another type. Often used for translations where the keys represent the locale identifier.

#### `ReferenceIdentifier` or `ReferenceIdentifierType`

A type that defines a reference to an instance of an entity.

### Type Parameters (Generics)

There are some declarations where you can define type parameters if you want it to be more flexible. In that case, you can import a declaration with a `Gen` prefix. `Entity` declarations do not support type parameters, but the other declaration types do (e.g. `GenTypeAlias`). In these cases, you have to define the `parameters` option, which must be an array of the type parameters you want to define via the `Param` function. You can optionally define type constraints for a type parameter using normal type functions.

To use these parameters in its definition, define them as parameters to the defining function and use the `GenericArgumentIdentifier` type to reference them.

```ts
const ValueAtName = GenTypeAlias(import.meta.url, {
  name: "ValueAtName",
  parameters: [Parameter("Value")],
  type: (Value) => Object({
    name: Required({
      type: GenericArgumentIdentifier(Value),
    }),
  }),
})
```

To reference a type alias in another declaration, use the `GenIncludeIdentifier` function.

```ts
const OtherEntity = Entity(import.meta.url, {
  name: "OtherEntity",
  namePlural: "OtherEntities",
  type: () => Object({
    arbitraryName: Required({
      type: GenIncludeIdentifier(ValueAtName, [String()]),
    }),
  }),
})
```

## GUI

To generate the graphical user interface, you need to create a `ModelContainer` with the schema you created before. Call either the `serve` or `generateValidateAndServe` functions with the created `ModelContainer`. You’ll be able to access the web interface at <http://localhost:3000>.

**Important:** If you only call the `serve` function, make sure the database has been validated before using either the `validate` or `generateAndValidate` functions.

If the database is in a Git repository, you’ll also get a simple Git GUI for managing branches and commits.

## Generate typings

To generate typings, you have to define the `outputs` property in the configuration file.

```ts
export default {
  // ...
  outputs: [
    TypeScriptOutput({
      targetPath: join(import.meta.dirname, "gen", "types.d.ts"),
    }),
    JsonSchemaOutput({
      targetPath: join(import.meta.dirname, "gen", "schema"),
      rendererOptions: {
        preserveFiles: true,
      },
    }),
  ],
} satisfies Config
```

You specify a target path where to save each generated content, and you can optionally provide custom settings to the respective renderers.

If the `preserveFiles` option is set to `true`, the target path is treated as a directory and the structure of your schema definitions is preserved. For example, if you have two files with definitions, `User.ts` and `Address.ts`, instead of outputting everything in `types.d.ts` (as specified above), a `types.d.ts` directory is created with `User.d.ts` and `Address.d.ts` files, where each file contains the declarations you put in each respectively.

This is possible due to the first argument to each declaration function, which should always be `import.meta.url`. If it is not set to this value, the `preserveFiles` option will behave differently according to the different path you set.
