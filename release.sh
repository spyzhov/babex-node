#!/usr/bin/env bash

npm version patch
npm publish
git push
git push --tags