#!/bin/sh

sed -i '' 's/var debugRenderPhaseSideEffectsForStrictMode = true;/var debugRenderPhaseSideEffectsForStrictMode = false;/'  node_modules/react-reconciler/cjs/react-reconciler.development.js
