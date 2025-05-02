# Changelog

All notable changes to this project will be documented in this file. See [commit-and-tag-version](https://github.com/absolute-version/commit-and-tag-version) for commit guidelines.

## [0.3.0](https://github.com/elyukai/tsondb/compare/v0.2.0...v0.3.0) (2025-05-02)


### ⚠ BREAKING CHANGES

* simple git gui

### Features

* ensure object key order for consistent serialization ([8d881e0](https://github.com/elyukai/tsondb/commit/8d881e04385ab3e4dc6489ce3ca1452fcaa2ff7a)), closes [#1](https://github.com/elyukai/tsondb/issues/1)
* **jsonschema-renderer:** add option to preserve the file structure of type definitions ([78f727e](https://github.com/elyukai/tsondb/commit/78f727ed3e2d55e2bd1b90e327631996ec7384c9)), closes [#10](https://github.com/elyukai/tsondb/issues/10)
* **jsonschema-renderer:** add option to render a JSON Schema without whitespace or with tabs ([be695ef](https://github.com/elyukai/tsondb/commit/be695ef107e199b6e896daacc70987c7433d559c)), closes [#10](https://github.com/elyukai/tsondb/issues/10)
* simple git gui ([e074daf](https://github.com/elyukai/tsondb/commit/e074dafc135507ba6ae84de5083d10e1d3cb7650)), closes [#2](https://github.com/elyukai/tsondb/issues/2)
* **ts-renderer:** add objectTypeKeyword option ([c5561c0](https://github.com/elyukai/tsondb/commit/c5561c0af281e105725c33426db921333df6699f)), closes [#10](https://github.com/elyukai/tsondb/issues/10)
* **ts-renderer:** add option to preserve the file structure of type definitions ([23cc520](https://github.com/elyukai/tsondb/commit/23cc5203d88d67103962319ec0dd3dc1dfaffd8c)), closes [#10](https://github.com/elyukai/tsondb/issues/10)


### Bug Fixes

* **api:** resolve type arguments in declarations for API requests ([3624e3a](https://github.com/elyukai/tsondb/commit/3624e3a27392fa41e1b9f40acc173b306d355781)), closes [#8](https://github.com/elyukai/tsondb/issues/8)
* ensure formatting of values of nested declarations ([84ffa95](https://github.com/elyukai/tsondb/commit/84ffa9571b0de83e74768a599c85bb908024ee4a))
* inline generic types with resolves type parameters ([71de01f](https://github.com/elyukai/tsondb/commit/71de01ff3e22c99f274420376f859846ffed37c3))
* markdown editor doesn't preview adjacent inline formats ([6811d8c](https://github.com/elyukai/tsondb/commit/6811d8c8acde746e00992c040668820947c048c0)), closes [#11](https://github.com/elyukai/tsondb/issues/11)
* only allow instances to be deleted if no other instance references/depends on it ([a743a11](https://github.com/elyukai/tsondb/commit/a743a11cceb8ee2de76a2f6a854d9710b44626d0)), closes [#6](https://github.com/elyukai/tsondb/issues/6)
* reload all files when switching git branches ([8285e87](https://github.com/elyukai/tsondb/commit/8285e8787a6c6a37c8172654ee1143043eb165c4)), closes [#7](https://github.com/elyukai/tsondb/issues/7)
* **ts-renderer:** render type arguments ([57d514c](https://github.com/elyukai/tsondb/commit/57d514cc6ee92c0e0a331add4901eb3ff0a986a8))

## [0.2.0](https://github.com/elyukai/tsondb/compare/v0.1.3...v0.2.0) (2025-04-22)


### ⚠ BREAKING CHANGES

* make ReferenceIdentifierType non-generic to improve type inference possibilities
* enum values are wrapped in enum case members to have comments

* make ReferenceIdentifierType non-generic to improve type inference possibilities ([4286f2c](https://github.com/elyukai/tsondb/commit/4286f2cc9a3a0a4a07b63e353abdb83c7f549aad))


### Features

* allow nested entity maps in all declarations ([bc86508](https://github.com/elyukai/tsondb/commit/bc86508210176fe472b340d83c4e2c1cb0ee81d1))
* deprecation marker ([190126c](https://github.com/elyukai/tsondb/commit/190126cacbcacff32f10a6ddd08686a3fac44250))
* enum values are wrapped in enum case members to have comments ([a37be0b](https://github.com/elyukai/tsondb/commit/a37be0b567cae0869d67974b4a9529c864b83853))
* simple markdown preview ([7b692a7](https://github.com/elyukai/tsondb/commit/7b692a77a780d7a65443fea6d5bb5136bc4feaff)), closes [#3](https://github.com/elyukai/tsondb/issues/3)


### Bug Fixes

* circular references caused stack overflow when searching for nested declarations ([f788480](https://github.com/elyukai/tsondb/commit/f7884809600a3a711ff3fa64dc1bd570ec622e64))
* deleting an array item should delete instead of add ([a7b11c7](https://github.com/elyukai/tsondb/commit/a7b11c76c37785046c959c2dcc4d83f1cad6413f))
* provide EnumCase export ([27f8871](https://github.com/elyukai/tsondb/commit/27f88715028d216276c2df22181e73b394d0f7aa))
* remove markdown renderer exports field ([20969f4](https://github.com/elyukai/tsondb/commit/20969f4f48bf7e4596504a4d603555067133a345))

## [0.1.3](https://github.com/elyukai/tsondb/compare/v0.1.2...v0.1.3) (2025-04-22)

## [0.1.2](https://github.com/elyukai/tsondb/compare/v0.1.1...v0.1.2) (2025-04-22)

## [0.1.1](https://github.com/elyukai/tsondb/compare/v0.1.0...v0.1.1) (2025-04-22)

## 0.1.0 (2025-04-22)


### ⚠ BREAKING CHANGES

* basic CRUD functionality web app
* entity identifiers are always strings
* separate ModelContainer logic into different functions with the option of combined functions
* use Lazy value instead of plain function for enum cases
* entity object should not have type parameters
* remove entity name layer in reference identifiers

* entity object should not have type parameters ([07b9ac6](https://github.com/elyukai/tsondb/commit/07b9ac668bc32bd916ec1c638a4a1a8a712a6b99))
* remove entity name layer in reference identifiers ([875e0ee](https://github.com/elyukai/tsondb/commit/875e0eeac7e23977a22dd7042e6ea56ad7cdcc8b))
* separate ModelContainer logic into different functions with the option of combined functions ([be0937c](https://github.com/elyukai/tsondb/commit/be0937c0b17af3297cb184790d1cb13405e00927))
* use Lazy value instead of plain function for enum cases ([daf2306](https://github.com/elyukai/tsondb/commit/daf23060d098a39db782988b8c6293c862661118))


### Features

* add string case conversion functions ([52989e4](https://github.com/elyukai/tsondb/commit/52989e48cf01b199812bc31e0c3e43f3ab3cb0bf))
* basic CRUD functionality web app ([f20d663](https://github.com/elyukai/tsondb/commit/f20d66391bc0947cecf0f2edb6e58ab35ec3961f))
* basic json schema renderer ([88e1210](https://github.com/elyukai/tsondb/commit/88e121051bfcf665b8982df4c79dbeb2a1a81ec0))
* date type ([a7b041b](https://github.com/elyukai/tsondb/commit/a7b041beb1a1001c9cbd06b1ff0f8a99dab37a3c))
* display non-entity declaration name in error ([e9b95b6](https://github.com/elyukai/tsondb/commit/e9b95b68a333fe1f9a4b48f09970f107dd27a56a))
* entity identifiers are always strings ([2ba1396](https://github.com/elyukai/tsondb/commit/2ba139652d7f4ca8a7d1d7e732c32263a384ffe6))
* enum declaration ([511c9fe](https://github.com/elyukai/tsondb/commit/511c9feb05dc6745bf465caf968619ec66827dc2))
* get referenced identifiers from declarations and types ([c10c13a](https://github.com/elyukai/tsondb/commit/c10c13a7769ae554eba025c95b242d5482a1d95b))
* management web application frame ([c359183](https://github.com/elyukai/tsondb/commit/c359183a79152b96c9ae07b1003bc9bded5cf3c2))
* non-generic IncludeIdentifierType constructor ([ef43cee](https://github.com/elyukai/tsondb/commit/ef43cee933f662a5122d51f6c40e5e276fdbcc94))
* provide information in entities how to retrieve a display name for an instance ([00afac2](https://github.com/elyukai/tsondb/commit/00afac2d34fd754847ca356ad4073dd5e9e93d31))
* resolve type arguments of all declarations if needed ([22f107b](https://github.com/elyukai/tsondb/commit/22f107be2f7f09a46094d7ef79e71f7c22fd48b7))
* serializable declarations and types ([83d411e](https://github.com/elyukai/tsondb/commit/83d411e3f84a03002b6f53dc4e598cc0ed28e01b))
* validate database in ModelContainer ([a5df75f](https://github.com/elyukai/tsondb/commit/a5df75f07fac0b779e578e874e2b3a009dc76e05))
* validate declaration name ([85c84d8](https://github.com/elyukai/tsondb/commit/85c84d831baffee39f543e17ad94b205cac9ce2d))
* validate object keys ([25a1c99](https://github.com/elyukai/tsondb/commit/25a1c99112636e273ba1214fdc9cbc2803aefdfa))
* very basic styles to not have default browser look ([584f85b](https://github.com/elyukai/tsondb/commit/584f85b58104ec7d48bc4289e7031cd9a8f7cde8))


### Bug Fixes

* camel case and pascal case transformations of all-uppercase string ([08c2a3e](https://github.com/elyukai/tsondb/commit/08c2a3e91b6c828ae698593f598719e44b4c5b75))
* declarations were not added to schema in constructor ([8534487](https://github.com/elyukai/tsondb/commit/8534487c4fb5faa7c80eed28a5b2257f97305c2c))
* ensure options never override explicitly set values ([656b396](https://github.com/elyukai/tsondb/commit/656b3967fbe90b0cc9cf2d24a18b3f2d30c147cd))
* entity object members can be optional ([78f639a](https://github.com/elyukai/tsondb/commit/78f639ab584ff2bfb68f59f7359bb8f2ad5871e2))
* prevent infinite recursion when resolving nested declarations ([4c62b39](https://github.com/elyukai/tsondb/commit/4c62b393ec82d6fc66b21037ccf9aef85e1348f2))
* resolve type arguments for json schema export ([974abdd](https://github.com/elyukai/tsondb/commit/974abdd5a9f934a9c9959575c4589786f2eec810))
* **ts-renderer:** remove additional newline after enum definition ([bbe9c78](https://github.com/elyukai/tsondb/commit/bbe9c78e083b483675c1185c06912097ff73bbbd))
* validate additionalProperties option ([b07cc24](https://github.com/elyukai/tsondb/commit/b07cc24547434d41c580e6c17d417ffd0a66a499))
* validate enum values ([5d76209](https://github.com/elyukai/tsondb/commit/5d762099bb035378b4c18a93f17817bb0c2d445f))
