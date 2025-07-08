# Contributing to TSON-DB

## General

TSON-DB follows [GitHub Flow](https://docs.github.com/en/get-started/using-github/github-flow), which is a light-weight branch-based collaboration workflow. If you have access to this repository, make sure to not commit to the `main` branch directly. There is no `develop` branch or anything, so just target the `main` branch in a pull request &mdash; unless you want to contribute to someone else’s work, of course.

### Useful commands

```sh
npm run build # to type-check and build the project once
npm run watch # to watch changes to the project and type-check and build on every change
```

## Web Client

The client uses the `preact` library, because `react` itself would be quite a large library for such a small application. If you want to use more libraries, make sure they work with `preact` **without** the `preact/compat` layer.

## Formatting

Always format your code using Prettier before requesting a merge. A `.prettierrc.yml` is contained in the repository, so everybody has the same settings.

## Commit Messages

Commit messages on `main` **must** follow the [Conventional Commits specification](https://www.conventionalcommits.org/en/v1.0.0/) so that a proper change log can be generated automatically.

Possible scopes to use manually are `api`, `client`, `<type>-renderer` (where `<type>` is the directory of the renderer, e.g. `jsonschema-renderer`). Please add more scopes here if you find others useful.

You can use any commit messages on your own branches as long as then the final feature is **squash-merged** with a proper commit message.

## Publish

To make a new release to npm on `main`, run

```sh
npm run release
```

to create a change log and add a tag, then run

```sh
git push --follow-tags
```

to push the change log commit as well as its associated tag. The tag will cause GitHub Actions to build and publish a new release to npm.

This is the only time that you should commit directly on the `main` branch.
