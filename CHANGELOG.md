# Changelog

All notable changes to this project will be documented in this file. See [commit-and-tag-version](https://github.com/absolute-version/commit-and-tag-version) for commit guidelines.

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
