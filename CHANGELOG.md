# Changelog

All notable changes to this project will be documented in this file. See [commit-and-tag-version](https://github.com/absolute-version/commit-and-tag-version) for commit guidelines.

## [0.13.2](https://github.com/elyukai/tsondb/compare/v0.13.1...v0.13.2) (2025-12-11)


### Bug Fixes

* display correct validation error count ([c7ebda3](https://github.com/elyukai/tsondb/commit/c7ebda317af4f328d71d101d861db22a65176b9a))

## [0.13.1](https://github.com/elyukai/tsondb/compare/v0.13.0...v0.13.1) (2025-12-10)


### Features

* does not throw on test errors ([7ed37e7](https://github.com/elyukai/tsondb/commit/7ed37e7a38fcfca0fa44a697699d4b216500f1a2))

## [0.13.0](https://github.com/elyukai/tsondb/compare/v0.12.9...v0.13.0) (2025-12-10)


### ⚠ BREAKING CHANGES

* **ts-renderer:** The config for the normal entity map is now in an
object.

### Features

* **ts-renderer:** child entity map helper type ([636cfd7](https://github.com/elyukai/tsondb/commit/636cfd7d4bd858f78537de83266b5ec680e1f8c3))
* unique constraints ([bb8d173](https://github.com/elyukai/tsondb/commit/bb8d173f96e5d8d7fc7add24d65b384e5f00dd22)), closes [#14](https://github.com/elyukai/tsondb/issues/14)

## [0.12.9](https://github.com/elyukai/tsondb/compare/v0.12.8...v0.12.9) (2025-12-04)


### Features

* validate translation messages ([1887a91](https://github.com/elyukai/tsondb/commit/1887a9105a330bf2b96aec00ba382c82a1e7a71f))

## [0.12.8](https://github.com/elyukai/tsondb/compare/v0.12.7...v0.12.8) (2025-12-04)


### Features

* **ts-renderer:** derive translation parameters ([d4b202a](https://github.com/elyukai/tsondb/commit/d4b202ae06383194b5d2fcc470e363141b814ee7))

## [0.12.7](https://github.com/elyukai/tsondb/compare/v0.12.6...v0.12.7) (2025-11-30)


### Features

* improve display name typing ([0521599](https://github.com/elyukai/tsondb/commit/052159938069294fedfa0a61a582071ae343a386))
* provide function to extract enum value ([431dd50](https://github.com/elyukai/tsondb/commit/431dd5005d4567dd47f6c34c1e6e29318661564a))

## [0.12.6](https://github.com/elyukai/tsondb/compare/v0.12.5...v0.12.6) (2025-11-30)


### Features

* configurable fraction digits for float types ([fad2cd0](https://github.com/elyukai/tsondb/commit/fad2cd034d4ede20e5d06d1f143d9d36d7b96a62))
* global search ([c5a5003](https://github.com/elyukai/tsondb/commit/c5a5003f1cb563814d9e20eae8ead1da33319ba6)), closes [#49](https://github.com/elyukai/tsondb/issues/49)


### Bug Fixes

* reflect git status in database in memory ([4d07011](https://github.com/elyukai/tsondb/commit/4d070114c0e57fcffe8aa5d1f17dc7e247e167fd)), closes [#54](https://github.com/elyukai/tsondb/issues/54)
* search should be case-insensitive ([e47e5df](https://github.com/elyukai/tsondb/commit/e47e5dfa7bb6b2b774124acdd8696d34110466bd))
* wrong polymorphic parent reference format ([188fa99](https://github.com/elyukai/tsondb/commit/188fa992518c07025662294adc6b5dcb3fc88428)), closes [#55](https://github.com/elyukai/tsondb/issues/55)

## [0.12.5](https://github.com/elyukai/tsondb/compare/v0.12.4...v0.12.5) (2025-11-27)

## [0.12.4](https://github.com/elyukai/tsondb/compare/v0.12.3...v0.12.4) (2025-11-27)

## [0.12.3](https://github.com/elyukai/tsondb/compare/v0.12.2...v0.12.3) (2025-11-21)


### Bug Fixes

* changes in child instances do not enable save button ([df5716e](https://github.com/elyukai/tsondb/commit/df5716e8f35d898cb238acfbbebe33fb20c5fbbb))
* create child instances immediately with new instance ([44f1963](https://github.com/elyukai/tsondb/commit/44f19637b82e327c90650d935e62ba83205158f0)), closes [#44](https://github.com/elyukai/tsondb/issues/44)
* server state should correctly update and be reflected in the editor after switching branches or pulling new commits ([22699b7](https://github.com/elyukai/tsondb/commit/22699b76d8e41f862c7cda6dcf805b6206bb8806)), closes [#45](https://github.com/elyukai/tsondb/issues/45)

## [0.12.2](https://github.com/elyukai/tsondb/compare/v0.12.1...v0.12.2) (2025-11-15)


### Bug Fixes

* export translation object type ([46e5997](https://github.com/elyukai/tsondb/commit/46e599715a590f5200e059061a75ddda99c30018))

## [0.12.1](https://github.com/elyukai/tsondb/compare/v0.12.0...v0.12.1) (2025-11-15)


### Features

* translation object type ([d75cec5](https://github.com/elyukai/tsondb/commit/d75cec58702ddafd96ef742443a8ddb579eaae82))

## [0.12.0](https://github.com/elyukai/tsondb/compare/v0.11.4...v0.12.0) (2025-11-15)


### ⚠ BREAKING CHANGES

* **ts-renderer:** make setting of additional id property of entities optional

### Features

* add pragma to generated typescript types ([ce383ab](https://github.com/elyukai/tsondb/commit/ce383abd386a43ed5cb8be14f882eb3bf2c72781))
* **ts-renderer:** add option to generate an entity map ([0ce5489](https://github.com/elyukai/tsondb/commit/0ce5489314d51d17972b8c90dd0901cc1511cd95))
* **ts-renderer:** make setting of additional id property of entities optional ([e396b5d](https://github.com/elyukai/tsondb/commit/e396b5d93a8fe5e9f98f57d4b7ad9b3beb68c474))

## [0.11.4](https://github.com/elyukai/tsondb/compare/v0.11.3...v0.11.4) (2025-11-15)


### Features

* make config more flexible if only a subset of commands is to be executed ([ea80de8](https://github.com/elyukai/tsondb/commit/ea80de8ed9696b9f675617dbf16ccc0846974741))


### Bug Fixes

* reinit server state after pulling ([cc8e1ab](https://github.com/elyukai/tsondb/commit/cc8e1ab4bb6dd6952ee2b5fe6ecdf141a5b98997))

## [0.11.3](https://github.com/elyukai/tsondb/compare/v0.11.2...v0.11.3) (2025-11-02)


### Features

* **markdown:** support nested lists ([955ed33](https://github.com/elyukai/tsondb/commit/955ed335b35b38915b571ec9b378347dcbbca3a4))

## [0.11.2](https://github.com/elyukai/tsondb/compare/v0.11.1...v0.11.2) (2025-11-02)

## [0.11.1](https://github.com/elyukai/tsondb/compare/v0.11.0...v0.11.1) (2025-10-27)


### Bug Fixes

* edit child entities at any level ([7f36761](https://github.com/elyukai/tsondb/commit/7f367610cf76d41649be361280ad279a665ebccd))
* **markdown:** empty output on leading newlines ([196b804](https://github.com/elyukai/tsondb/commit/196b8045d90774af8a66823e2e0322cbc3beb125))

## [0.11.0](https://github.com/elyukai/tsondb/compare/v0.10.2...v0.11.0) (2025-10-27)


### ⚠ BREAKING CHANGES

* handle self-recursive generic declarations

### Features

* handle self-recursive generic declarations ([f1a4633](https://github.com/elyukai/tsondb/commit/f1a46334447a766b70a8635b38dcc0acb98c5eb9))


### Bug Fixes

* check generic recursive types to be able to be fully resolved ([c2b1b93](https://github.com/elyukai/tsondb/commit/c2b1b93a587f018cbd53b62de4ce7fb2d75ded61))

## [0.10.2](https://github.com/elyukai/tsondb/compare/v0.10.1...v0.10.2) (2025-10-17)


### Features

* **markdown:** add support for superscript ([23743d1](https://github.com/elyukai/tsondb/commit/23743d14654dde455acb0600756a21d2b0ea2e33))

## [0.10.1](https://github.com/elyukai/tsondb/compare/v0.10.0...v0.10.1) (2025-10-17)


### Bug Fixes

* disable viewing a file in the changes list when it has been deleted ([80f5f85](https://github.com/elyukai/tsondb/commit/80f5f85906b52d5a0383d4e058290c9d173bd8ce))
* display nested child instances ([10214bc](https://github.com/elyukai/tsondb/commit/10214bc97ac01f3e5a9280f74a374a82656b8e18))

## [0.10.0](https://github.com/elyukai/tsondb/compare/v0.9.0...v0.10.0) (2025-10-14)


### ⚠ BREAKING CHANGES

* improve flexibility for custom styling of footnotes

### Features

* improve flexibility for custom styling of footnotes ([00a218d](https://github.com/elyukai/tsondb/commit/00a218d83fb2dd744ec73909b365e9aca3a7ed2a))

## [0.9.0](https://github.com/elyukai/tsondb/compare/v0.8.5...v0.9.0) (2025-10-14)


### ⚠ BREAKING CHANGES

* simplify footnote rendering, make label suffix customizable, add more information to rendered html

### Features

* simplify footnote rendering, make label suffix customizable, add more information to rendered html ([4b37f07](https://github.com/elyukai/tsondb/commit/4b37f07264d08da263ca0ccbdf17797202e86966))


### Bug Fixes

* italic with bold inside matched unrelated styles ([25e55fb](https://github.com/elyukai/tsondb/commit/25e55fb93179e6c5b884045066cebfd3ef642a11))

## [0.8.5](https://github.com/elyukai/tsondb/compare/v0.8.4...v0.8.5) (2025-10-14)


### Features

* **editor:** save instances with cmdOrCtrl+S ([1e45f3e](https://github.com/elyukai/tsondb/commit/1e45f3ec00e3b99d5682d49d64f8b510f01482d7))

## [0.8.4](https://github.com/elyukai/tsondb/compare/v0.8.3...v0.8.4) (2025-10-14)


### Bug Fixes

* **markdown:** markdown table should not emit column index ([d4e414a](https://github.com/elyukai/tsondb/commit/d4e414ace23e378a0f96713f142aca9a41154255))

## [0.8.3](https://github.com/elyukai/tsondb/compare/v0.8.2...v0.8.3) (2025-10-14)


### Bug Fixes

* **markdown:** apply table column text alignment indicators ([bc905cf](https://github.com/elyukai/tsondb/commit/bc905cf4975189244bada0e297b50971716fc8bc))

## [0.8.2](https://github.com/elyukai/tsondb/compare/v0.8.1...v0.8.2) (2025-10-14)


### Bug Fixes

* **markdown:** only parse definition lists at the start of the remaining text ([796e04c](https://github.com/elyukai/tsondb/commit/796e04c7397006c5710a9e73d68c05c82f2d5f2e))

## [0.8.1](https://github.com/elyukai/tsondb/compare/v0.8.0...v0.8.1) (2025-10-14)


### Features

* disable save buttons when there are no changes ([eff3a88](https://github.com/elyukai/tsondb/commit/eff3a88605d4df361c5e7621c5fad1113f398e0a))
* markdown definition lists ([045e7ea](https://github.com/elyukai/tsondb/commit/045e7ea9722944a1703a25754f41d45a1f26f38c))
* resolve referenced types for instance value type in display name customizers ([2ac2b65](https://github.com/elyukai/tsondb/commit/2ac2b659ac1fe6454a37de7fe805a8f67a7e0f94))


### Bug Fixes

* multiple adjacent bold and italic formattings were read as nested ([598111f](https://github.com/elyukai/tsondb/commit/598111fc26eac65f88ee66e3cd5f117cbb700ac2))
* outer heading level was not respected in containers and footnotes ([73c7f44](https://github.com/elyukai/tsondb/commit/73c7f44f336d2fc9b9af7a09de65476fe6712ad8))
* reduce content nodes of links ([def9fb1](https://github.com/elyukai/tsondb/commit/def9fb16789cba0750f7223d35ca27e3583029f4))
* remove beforeunload event listener after save and continue ([abd8eb9](https://github.com/elyukai/tsondb/commit/abd8eb9739a1a1f80e7bdeb05eeccaf45dbabe97))

## [0.8.0](https://github.com/elyukai/tsondb/compare/v0.7.12...v0.8.0) (2025-10-13)


### ⚠ BREAKING CHANGES

* add markdown table sections, table colspan, footnotes and containers/sections

### Features

* add markdown table sections, table colspan, footnotes and containers/sections ([753ffd8](https://github.com/elyukai/tsondb/commit/753ffd8dfa697fd538fe743e3419614e9fb33fd0))

## [0.7.12](https://github.com/elyukai/tsondb/compare/v0.7.11...v0.7.12) (2025-10-13)


### Bug Fixes

* changes tab needs to be shown in git dialog when sidebar is disabled ([f8ca397](https://github.com/elyukai/tsondb/commit/f8ca397f68643e5427812d81f83bea656497226a))

## [0.7.11](https://github.com/elyukai/tsondb/compare/v0.7.10...v0.7.11) (2025-10-13)


### Features

* add appropriate lang attribute to items of locale maps ([2cdff1f](https://github.com/elyukai/tsondb/commit/2cdff1f457fb9b5b883b127e34968d6fd5f1e9ce))
* add possibility to always show git as dialog instead of only a sidebar in larger viewports ([1587cf4](https://github.com/elyukai/tsondb/commit/1587cf40965706df54e9c01bbfd9042608eb9127))
* improve markdown preview styling ([d6d8fac](https://github.com/elyukai/tsondb/commit/d6d8fac15accdd51fe2deee57b6b81042448e73f))

## [0.7.10](https://github.com/elyukai/tsondb/compare/v0.7.9...v0.7.10) (2025-10-13)


### Features

* show confirmation dialog for navigation with unsaved changes ([41495ed](https://github.com/elyukai/tsondb/commit/41495ed8dbca34e79b3dd48528a5af860562d1f4))

## [0.7.9](https://github.com/elyukai/tsondb/compare/v0.7.8...v0.7.9) (2025-10-12)

## [0.7.8](https://github.com/elyukai/tsondb/compare/v0.7.7...v0.7.8) (2025-10-12)


### Features

* add view button to git file list ([2dcc33e](https://github.com/elyukai/tsondb/commit/2dcc33edf53a25dcb58ff2efcf8a489f4abe08e9))
* git branch manager ([133758e](https://github.com/elyukai/tsondb/commit/133758e84c27f8a82d35ba6cb68e71ab724bd921)), closes [#39](https://github.com/elyukai/tsondb/issues/39) [#40](https://github.com/elyukai/tsondb/issues/40)
* loading overlay for longer-running operations ([2e495b0](https://github.com/elyukai/tsondb/commit/2e495b05785ea45c4e27ac033ac2a7204ff1a90e))
* table captions in markdown ([f8f4b0a](https://github.com/elyukai/tsondb/commit/f8f4b0a0052c21aab03691f048e4dd7027b70b9f)), closes [#42](https://github.com/elyukai/tsondb/issues/42)


### Bug Fixes

* typo in git status ([86b788c](https://github.com/elyukai/tsondb/commit/86b788cfd5fba527757f43bf644b385405d8e4ff))

## [0.7.7](https://github.com/elyukai/tsondb/compare/v0.7.6...v0.7.7) (2025-10-08)


### Bug Fixes

* check nested entity maps for name duplicates ([3e2eb6d](https://github.com/elyukai/tsondb/commit/3e2eb6d108cde0f55880cb22b440bb8f19fd7fcd))
* nested declaration resolving ([7b1882d](https://github.com/elyukai/tsondb/commit/7b1882d03aceb1746c3306664ba2020c5357ccc2))
* only create type skeleton for new instance when all declarations are loaded ([eaa0259](https://github.com/elyukai/tsondb/commit/eaa02594e43627de714f3a703ec92fb65cd40c13)), closes [#41](https://github.com/elyukai/tsondb/issues/41)
* only try to save instance when one of the submit buttons is clicked ([5396275](https://github.com/elyukai/tsondb/commit/539627554fd5281e04cdea25ae22f42df055f2fd))
* remove console.log ([642f37d](https://github.com/elyukai/tsondb/commit/642f37dca2de5aaa123efad8fd9c8431146f8e26))

## [0.7.6](https://github.com/elyukai/tsondb/compare/v0.7.5...v0.7.6) (2025-10-05)


### Bug Fixes

* syntax highlighting for heading markers ([71d2e53](https://github.com/elyukai/tsondb/commit/71d2e532ad300d6100cb04abbfc85c1da9b253c8))

## [0.7.5](https://github.com/elyukai/tsondb/compare/v0.7.4...v0.7.5) (2025-10-05)


### Features

* support custom stylesheet ([4d9b107](https://github.com/elyukai/tsondb/commit/4d9b107c058089cddc36ed131f47aaca19a7bb35)), closes [#37](https://github.com/elyukai/tsondb/issues/37)
* support markdown headings ([a19a56f](https://github.com/elyukai/tsondb/commit/a19a56f49b33b2f8e486d47db937b5f2762d31a0)), closes [#36](https://github.com/elyukai/tsondb/issues/36)


### Bug Fixes

* git button and git content placement in narrow viewports ([235f9ff](https://github.com/elyukai/tsondb/commit/235f9ff91545d7ed6df309a86b7ba2caa41cc232)), closes [#35](https://github.com/elyukai/tsondb/issues/35)

## [0.7.4](https://github.com/elyukai/tsondb/compare/v0.7.3...v0.7.4) (2025-10-02)


### Bug Fixes

* follow type alias includes for entity display name path check ([0ef2611](https://github.com/elyukai/tsondb/commit/0ef2611a7f138e291e49b28947dfc54a11345344))

## [0.7.3](https://github.com/elyukai/tsondb/compare/v0.7.2...v0.7.3) (2025-10-02)


### Bug Fixes

* getDisplayNameForInstanceId should return full display name result ([ca896c3](https://github.com/elyukai/tsondb/commit/ca896c3203bfc211407dd0381335ff9dff87bdaf))

## [0.7.2](https://github.com/elyukai/tsondb/compare/v0.7.1...v0.7.2) (2025-10-02)


### Bug Fixes

* return type of child instances getter ([5156c27](https://github.com/elyukai/tsondb/commit/5156c27f0b8402f75aefea844cd229f42a6eb760))

## [0.7.1](https://github.com/elyukai/tsondb/compare/v0.7.0...v0.7.1) (2025-10-02)


### Bug Fixes

* add instance id parameter to display name customizer ([4299101](https://github.com/elyukai/tsondb/commit/4299101e1853365c9d7219ff958d91cbddcccce3))

## [0.7.0](https://github.com/elyukai/tsondb/compare/v0.6.2...v0.7.0) (2025-10-02)


### ⚠ BREAKING CHANGES

* add child entity getter to display name customizer parameters

### Features

* add child entity getter to display name customizer parameters ([154dd16](https://github.com/elyukai/tsondb/commit/154dd16783f4106a1c701bc87f2f7e8f5d26429d))

## [0.6.2](https://github.com/elyukai/tsondb/compare/v0.6.1...v0.6.2) (2025-10-02)


### Bug Fixes

* make child entities type visible to package users ([11d8743](https://github.com/elyukai/tsondb/commit/11d87433eab12576b51587b308fbdba8460a3d41))

## [0.6.1](https://github.com/elyukai/tsondb/compare/v0.6.0...v0.6.1) (2025-10-02)

## [0.6.0](https://github.com/elyukai/tsondb/compare/v0.5.19...v0.6.0) (2025-10-01)


### ⚠ BREAKING CHANGES

* child entities type
* extract serialized types into shared folder and centralize functions switching over node kinds

* extract serialized types into shared folder and centralize functions switching over node kinds ([227abc0](https://github.com/elyukai/tsondb/commit/227abc0af4fc4462f4171477bc42c858015173f3))


### Features

* allow grouping of entities on editor home page ([3eb47b8](https://github.com/elyukai/tsondb/commit/3eb47b8c880ea0765981bdf690e31ae72fd06376)), closes [#20](https://github.com/elyukai/tsondb/issues/20)
* attributed strings in markdown ([43dffe4](https://github.com/elyukai/tsondb/commit/43dffe408a342c9ebbebcb3d0bcaa93f9cf171a9)), closes [#27](https://github.com/elyukai/tsondb/issues/27)
* child entities type ([aa020ba](https://github.com/elyukai/tsondb/commit/aa020baaad8c9ed5a13bc6dd21f35983e4ef2e83)), closes [#31](https://github.com/elyukai/tsondb/issues/31)
* locale selection for display names and instance groups ([ead9f9a](https://github.com/elyukai/tsondb/commit/ead9f9acde43696909d4f269d918374ef2c8f891)), closes [#18](https://github.com/elyukai/tsondb/issues/18)
* option to display all enum cases as radio buttons ([365ba4a](https://github.com/elyukai/tsondb/commit/365ba4a43065f614c5e4a0cd7968d7075426ae01))
* provide disabled placeholder forms for every enum case in radio mode ([298b25d](https://github.com/elyukai/tsondb/commit/298b25da62f7fb025e4f4af6cb1f23eb4cbaeb35))


### Bug Fixes

* child entity type should resolve child instance with polymorphic parents ([aa6731d](https://github.com/elyukai/tsondb/commit/aa6731d047ad95cd6fbd29995774be1e6b5f7338))
* limit number of concurrent file reads when loading the database ([a41d72a](https://github.com/elyukai/tsondb/commit/a41d72a831e7bc19f78fa43359931b9b75b09730)), closes [#29](https://github.com/elyukai/tsondb/issues/29)
* make disabled property optional for validation errors ([545f6e2](https://github.com/elyukai/tsondb/commit/545f6e219dc2e4a5341c6e646b373ea64572d1d3))
* reduce layout jumps during api calls ([f3d5277](https://github.com/elyukai/tsondb/commit/f3d5277ec1a650ef1e367ec53757f7706597e581))
* reload global instances when deleting an instance ([919f859](https://github.com/elyukai/tsondb/commit/919f859cf9bf5b0c193d4e516ee4a06213f9893a))
* types in declarations should have their parent key always set correctly when an instance of a node is used in multiple places ([2534f7c](https://github.com/elyukai/tsondb/commit/2534f7cd3b9b12c11fb56af0db1bc57ee73936f8)), closes [#19](https://github.com/elyukai/tsondb/issues/19)
* uneven container item padding ([6f7da16](https://github.com/elyukai/tsondb/commit/6f7da166deb8c187e47986dcb980ece687dfdddb))
* use Object.is for shallow equality check in comparison utils ([bdd7fad](https://github.com/elyukai/tsondb/commit/bdd7fad8e4a0052bc7a72d06d6e99c5e90b88856))

## [0.5.19](https://github.com/elyukai/tsondb/compare/v0.5.18...v0.5.19) (2025-09-18)


### Bug Fixes

* resolve escaped characters in markdown for display ([e39e7b2](https://github.com/elyukai/tsondb/commit/e39e7b236413cc437fad95882bb833188b3627f3))

## [0.5.18](https://github.com/elyukai/tsondb/compare/v0.5.17...v0.5.18) (2025-09-18)


### Features

* add debug logs to schema creation ([ab38473](https://github.com/elyukai/tsondb/commit/ab3847311447895220739fc6a993fcb0ebed3010))
* improve markdown parsing reliability ([1f2309a](https://github.com/elyukai/tsondb/commit/1f2309a8830df38abcce00789f1c13e1211fb73e))
* support links in markdown ([9b1aaf5](https://github.com/elyukai/tsondb/commit/9b1aaf59e98f4e2c73d0917c4e76cf48b678d5a1))
* support tables in markdown ([e737322](https://github.com/elyukai/tsondb/commit/e73732237a5ba0b52e968b4d9dfa8baa35952a2f)), closes [#26](https://github.com/elyukai/tsondb/issues/26)

## [0.5.17](https://github.com/elyukai/tsondb/compare/v0.5.16...v0.5.17) (2025-09-16)


### Features

* allow type aliases of object types to be used as a type for a nested entity map ([58919c0](https://github.com/elyukai/tsondb/commit/58919c0211258b33c8a8cc6dd10e79b3036a57ca))

## [0.5.16](https://github.com/elyukai/tsondb/compare/v0.5.15...v0.5.16) (2025-09-16)


### Features

* add more debug messages to identify long-running operations ([3c4c423](https://github.com/elyukai/tsondb/commit/3c4c42383ffaf53ace66c8c31292d5acf2561657))
* syntax highlighting for supported markdown features ([31acca9](https://github.com/elyukai/tsondb/commit/31acca93eae4a62f62aefe2851e28084dd4364c7))
* use monospace font for markdown textarea and add help text ([515b57d](https://github.com/elyukai/tsondb/commit/515b57d04ac0635baed02d9f5e14276a00e9d3e5))


### Bug Fixes

* markdown textarea autosizing did not fully work due to mismatched font ([4e30d5b](https://github.com/elyukai/tsondb/commit/4e30d5b0ec5a94d9491c9735a731d5c307fe46c3))

## [0.5.15](https://github.com/elyukai/tsondb/compare/v0.5.14...v0.5.15) (2025-09-14)


### Bug Fixes

* only try getting references in enum type if the case has an associated type ([28e6aa7](https://github.com/elyukai/tsondb/commit/28e6aa78a8091c14500d18642ec9ca02d9d49e8e))
* reword error in enum key to error in enum case ([6695dbf](https://github.com/elyukai/tsondb/commit/6695dbfda74ff104240eff96b4fe72830aca96cf))

## [0.5.14](https://github.com/elyukai/tsondb/compare/v0.5.13...v0.5.14) (2025-09-13)


### Bug Fixes

* include enum key in error hierarchy ([bdf06e1](https://github.com/elyukai/tsondb/commit/bdf06e10c6381d591975d5dcf64c1058d8d63f82))

## [0.5.13](https://github.com/elyukai/tsondb/compare/v0.5.12...v0.5.13) (2025-09-13)


### Features

* consistent home page title in titles and breadcrumbs ([16d3c50](https://github.com/elyukai/tsondb/commit/16d3c506f4274374796d7c1f917046572adc3b5f))
* only use console text styling for cli api, not for web errors ([50da12f](https://github.com/elyukai/tsondb/commit/50da12ff040cd019bdc8e6c4a3f419a52916b5fa))
* remove duplicate home breadcrumb from home page without layout shift ([b5cb4d7](https://github.com/elyukai/tsondb/commit/b5cb4d755cc93cb0df5c8a0f9743d96216ff5e18))


### Bug Fixes

* check referential integrity by default ([eda625d](https://github.com/elyukai/tsondb/commit/eda625d9a2145cca41bf0fe53badbf7e79e9bee1))
* remove debug output on instance pages ([3ad5449](https://github.com/elyukai/tsondb/commit/3ad54490da3869de3ff1ed859e0a607c91f21029))

## [0.5.12](https://github.com/elyukai/tsondb/compare/v0.5.11...v0.5.12) (2025-09-13)

## [0.5.11](https://github.com/elyukai/tsondb/compare/v0.5.10...v0.5.11) (2025-09-13)


### Features

* improve checkmark visibility ([5e10f6c](https://github.com/elyukai/tsondb/commit/5e10f6ca565775a39ff078c19a2655c0288209ff))


### Bug Fixes

* form components updating old state, resulting in data loss of previous changes ([3a77615](https://github.com/elyukai/tsondb/commit/3a776153d196e4e91933193162305e14ebd825b0))

## [0.5.10](https://github.com/elyukai/tsondb/compare/v0.5.9...v0.5.10) (2025-09-12)


### Features

* label add and remove buttons after the property or element they remove ([b0264fa](https://github.com/elyukai/tsondb/commit/b0264fa592eab8d426f51cb4e6bbb28408dab68b))
* unify entries styling and improve layout on small screens ([fedc4c0](https://github.com/elyukai/tsondb/commit/fedc4c046747feebb80580f501e0bcf3f820943c))


### Bug Fixes

* any button click tries to save an instance ([09e50e1](https://github.com/elyukai/tsondb/commit/09e50e13681f7aa9d8463905a52ed488de75a8d8)), closes [elyukai/optolith-data#656](https://github.com/elyukai/optolith-data/issues/656)

## [0.5.9](https://github.com/elyukai/tsondb/compare/v0.5.8...v0.5.9) (2025-09-12)


### Features

* add "save and continue" button to instance creation page ([01cf70c](https://github.com/elyukai/tsondb/commit/01cf70c59f0f877bff8fcc2f12ff7c8848e76d94)), closes [#22](https://github.com/elyukai/tsondb/issues/22)
* add debug output for validation options ([7592796](https://github.com/elyukai/tsondb/commit/759279605ca2e884d6286210348416412808fe1e))
* auto-sizing textarea for markdown input ([22a8217](https://github.com/elyukai/tsondb/commit/22a821741e646015a7940b89b6a510804fcdf6a0))
* check that all entity names used for restricting the validation are correct ([9a905a5](https://github.com/elyukai/tsondb/commit/9a905a5afd870684c636ac494810b739b5020541))
* display name customizer function for entity declarations ([d65643a](https://github.com/elyukai/tsondb/commit/d65643a1ef76d80a008c2e9b896162ab9f62b304))
* display page names in window title and use plural for entities ([3d16202](https://github.com/elyukai/tsondb/commit/3d162023239029d9770e113de35bf3a47276a2a1))
* search in entity list ([359c8d8](https://github.com/elyukai/tsondb/commit/359c8d88feb1152ab6f4dae85c1b4e7892d47f88))
* search in instance lists ([ff67543](https://github.com/elyukai/tsondb/commit/ff6754305b016c87b794bb84eb49c4b0528b3de8))
* sticky instance form footer ([37fc7f4](https://github.com/elyukai/tsondb/commit/37fc7f41aed3121a58536b9fd3107a7ed4698af9)), closes [#24](https://github.com/elyukai/tsondb/issues/24)
* use empty string as default name ([252f2ac](https://github.com/elyukai/tsondb/commit/252f2ac6c800690406d75344ffd6d8b73f2e72b7))


### Bug Fixes

* allow displayNameCustomizer to be used even when displayName is set to null ([8ba2004](https://github.com/elyukai/tsondb/commit/8ba2004353b745f94c41e021c324a1e7568f15bd))
* markdown stops being formatted at all when there is a new line at the end of the markdown string ([f6c5a14](https://github.com/elyukai/tsondb/commit/f6c5a14a49216a4180ecf33316818c489f7889b5)), closes [#23](https://github.com/elyukai/tsondb/issues/23)
* pattern should only be applied to a part of the string unless clearly specified ([7fa00f3](https://github.com/elyukai/tsondb/commit/7fa00f365a0d26e551e86257b2337f1a9cc59311)), closes [elyukai/optolith-data#658](https://github.com/elyukai/optolith-data/issues/658)
* sort numbers in display names by their full number ([c12aea5](https://github.com/elyukai/tsondb/commit/c12aea5e3115658969b8eb4ba908c43922c527cc))

## [0.5.8](https://github.com/elyukai/tsondb/compare/v0.5.7...v0.5.8) (2025-09-04)


### Bug Fixes

* adjust static file delivery for changed folder structure ([8edb899](https://github.com/elyukai/tsondb/commit/8edb8998f18005d7d0ac92fb87101201f3ec30a3))

## [0.5.7](https://github.com/elyukai/tsondb/compare/v0.5.6...v0.5.7) (2025-09-04)

## [0.5.6](https://github.com/elyukai/tsondb/compare/v0.5.5...v0.5.6) (2025-09-04)


### Features

* **cli:** add options to switch off referential integrity checks and only check specific entities ([d007089](https://github.com/elyukai/tsondb/commit/d0070892e18b9ca7453c2caec71af422d84ce1d8))
* display validation errors no matter if debug logs are enables and format them with color ([a3213c6](https://github.com/elyukai/tsondb/commit/a3213c6d181656eb2cd71f79666707c93196a00b))


### Bug Fixes

* type-only imports ([a02f865](https://github.com/elyukai/tsondb/commit/a02f8656d5a04ca10b313fd26b527afa6e52cced))

## [0.5.5](https://github.com/elyukai/tsondb/compare/v0.5.4...v0.5.5) (2025-07-16)


### Bug Fixes

* make absolute config import work on windows ([8cdcdc2](https://github.com/elyukai/tsondb/commit/8cdcdc27d6cbddd9ffb49394be575ae6cc7c1e9b))

## [0.5.4](https://github.com/elyukai/tsondb/compare/v0.5.3...v0.5.4) (2025-07-14)


### Features

* display number of errors after validation ([5c373a9](https://github.com/elyukai/tsondb/commit/5c373a988213da742eac147a75420bed3fe5217f))

## [0.5.3](https://github.com/elyukai/tsondb/compare/v0.5.2...v0.5.3) (2025-07-14)


### Features

* sort validation errors by file path ([665e46b](https://github.com/elyukai/tsondb/commit/665e46b7809ea1c949e84c984703add9ee46dd30))

## [0.5.2](https://github.com/elyukai/tsondb/compare/v0.5.1...v0.5.2) (2025-07-12)


### Features

* format comments as markdown and add rules for code and lists ([f0478b7](https://github.com/elyukai/tsondb/commit/f0478b716c3cfc2c151b1199599978d0fac5bc48))
* only report a type parameter shadowing a declaration if the declaration is referenced within the scope of the type parameter ([2bfa050](https://github.com/elyukai/tsondb/commit/2bfa05052e0bd23de65626f2b9aac9712af0fa3d))


### Bug Fixes

* include type arguments in nested declaration search ([73ff195](https://github.com/elyukai/tsondb/commit/73ff1955f168c61cd4893d63b6f5665947167501))
* wrong input border color syntax ([13d77dd](https://github.com/elyukai/tsondb/commit/13d77dd13253d5af90c3acc6daffadb3ab3d67dc))

## [0.5.1](https://github.com/elyukai/tsondb/compare/v0.5.0...v0.5.1) (2025-07-12)


### Features

* dark mode ([43806d4](https://github.com/elyukai/tsondb/commit/43806d4c047e3d98bc54af391b5ff7c122d24006))


### Bug Fixes

* list item title alignment ([f2248dd](https://github.com/elyukai/tsondb/commit/f2248dd87bd3f503be7349ce7d27b41ad95e3d42))
* serve preact and preact-iso regardless of where they are located ([7087465](https://github.com/elyukai/tsondb/commit/7087465b1a01fb6f90778714191bf9bd956f10f7))

## [0.5.0](https://github.com/elyukai/tsondb/compare/v0.4.0...v0.5.0) (2025-07-11)


### ⚠ BREAKING CHANGES

* require dataRootPath in config file
* remove server name option

### Features

* add locations of types to error message if duplicate identifiers are found ([c2c6b8e](https://github.com/elyukai/tsondb/commit/c2c6b8e5699612c65b65b9445816945989a67a0f))
* add server options setting to config ([64fbcf8](https://github.com/elyukai/tsondb/commit/64fbcf88ae2857be46d331e4e76ebe3c65c5ba84))
* disable display name derivation by setting displayName to null ([9fc76e3](https://github.com/elyukai/tsondb/commit/9fc76e34547fa071c8c26c4e40deeb6c9d4ca74e))
* display errors when starting the server, especially when the port is already in use ([ec872da](https://github.com/elyukai/tsondb/commit/ec872da21d794d098c70b458c243af782dfb7345))
* display full file name for validation errors ([a204c35](https://github.com/elyukai/tsondb/commit/a204c35adc29e0bc4abdd7878cc23f60dab293f0))
* improve error reporting for invalid enum value definitions ([e17499d](https://github.com/elyukai/tsondb/commit/e17499d05711f58992de5dcd4ea18b5e26927224))
* **jsonschema-renderer:** add debug logs to jsonschema renderer ([bf3258f](https://github.com/elyukai/tsondb/commit/bf3258f221457ea95b06e3c1f3bbfe5a73efb8b5))
* new format command ([ddb050e](https://github.com/elyukai/tsondb/commit/ddb050e84165b4d67b4d0d99250f39338738c950))
* provide sorted instance container overviews if all instances of an entity are fetched ([8ed543a](https://github.com/elyukai/tsondb/commit/8ed543af590caf8a00ba751846b62e9e02ec746f))
* remove server name option ([c3a531c](https://github.com/elyukai/tsondb/commit/c3a531c1a43bb9aa27ec675b1d544c3142b76cc0))
* require dataRootPath in config file ([6a5ae62](https://github.com/elyukai/tsondb/commit/6a5ae6255f5f7b29c79f9b8d013475e51800a9c3))


### Bug Fixes

* duplicate nested entity declaration as auxiliary declaration in generic declaration ([a3e93d1](https://github.com/elyukai/tsondb/commit/a3e93d1d26ec9a08c6d31b362b96f57cba999579))
* hook dependencies for useInstanceNamesByEntity ([021029c](https://github.com/elyukai/tsondb/commit/021029cd8e87faebf44e7b40a795011b93f440eb))
* hook dependencies for useMappedAPIResource ([1907a94](https://github.com/elyukai/tsondb/commit/1907a949833c231c88283b6ae0c3260a64bc8f5f))
* static folders after folder layout change ([82dd047](https://github.com/elyukai/tsondb/commit/82dd047b9124cfaab1f22c88851b872fbdff4133))
* **ts-renderer:** import types only once ([11629e7](https://github.com/elyukai/tsondb/commit/11629e7b4f57cfdfef7218314798384813400d52))

## [0.4.0](https://github.com/elyukai/tsondb/compare/v0.3.0...v0.4.0) (2025-07-10)


### ⚠ BREAKING CHANGES

* rename GenericArgumentIdentifier to TypeArgument to align with TypeParameter

* rename GenericArgumentIdentifier to TypeArgument to align with TypeParameter ([cdbbb3d](https://github.com/elyukai/tsondb/commit/cdbbb3d972b9a96b0c359b87d7d36c80cb8a94ac))


### Features

* add server options parameter to functions that create the webserver ([c138407](https://github.com/elyukai/tsondb/commit/c138407f75343218bc266893540cdbcd458b4044))
* command line interface for generating outputs, validating data and starting the server ([c1fc2e3](https://github.com/elyukai/tsondb/commit/c1fc2e37e2113c74e0f56d1f79d31d668c134443))
* move the importmap into the head ([a4cb775](https://github.com/elyukai/tsondb/commit/a4cb7755df602ada7b72597469cf5d127ad89a9b))


### Bug Fixes

* array utility argument validation and string title case manipulation ([94949e1](https://github.com/elyukai/tsondb/commit/94949e1aca0358461e7a4f2792f52ea34a36c4c7))
* make all exports from EnumType available for public use ([bdf9f91](https://github.com/elyukai/tsondb/commit/bdf9f917ac909f6a48695614a690397719068a66))
* mistyped export of jsonschema renderer ([1a7782d](https://github.com/elyukai/tsondb/commit/1a7782d0c7d62f736a3e8d96eb077055f4b38ebc))
* wrong validation results and error messages ([aa27167](https://github.com/elyukai/tsondb/commit/aa271674976280a59584d0ecbab314166244c7ec))

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
