#!/usr/bin/env bash

if [[ "$1" == "" ]]; then
LEVEL=patch
else
LEVEL=$1
fi

npm version ${LEVEL}
VERSION=$(jq -r ".version" package.json)
git add ./package.json
git commit -m "Increase version"
git push
git tag $(VERSION)
git push --tags
npm publish