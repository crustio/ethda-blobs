# Publish to npmjs

```sh
$ npm login --registry=https://registry.npmjs.org
$ npm whoami
# Publish package via `np` command (Version number in package.json will be auto updated and committed).
$ yarn np [1.0.0]
```

# Development

## Install Dependencies

```sh
$ yarn
```

## Build

### Lint

```sh
$ yarn lint
```

### Auto fix lint errors

```sh
$ yarn fix
```