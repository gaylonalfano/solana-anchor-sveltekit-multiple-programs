import { sveltekit } from '@sveltejs/kit/vite';
import inject from '@rollup/plugin-inject';
import path from 'path';
// FIXME Error with Vite + Metaplex due to Node.js dependencies
// https://github.com/metaplex-foundation/js-examples/tree/main/getting-started-vite
import { NodeGlobalsPolyfillPlugin } from '@esbuild-plugins/node-globals-polyfill';
import nodePolyfills from 'rollup-plugin-node-polyfills';

/** @type {import('vite').UserConfig} */
const config = {
	plugins: [sveltekit()],
	define: {
		'process.env.BROWSER': true,
		'process.env.NODE_DEBUG': JSON.stringify(''),
		'process.env.VERSION': JSON.stringify(process.env.npm_package_version)
	},
	optimizeDeps: {
		esbuildOptions: {
			plugins: [NodeGlobalsPolyfillPlugin({ buffer: true })]
		},
		include: ['@project-serum/anchor', '@solana/web3.js', 'buffer']
	},
	resolve: {
		alias: {
			$stores: path.resolve('./src/stores'),
			stream: 'rollup-plugin-node-polyfills/polyfills/stream',
			events: 'rollup-plugin-node-polyfills/polyfills/events',
			assert: 'assert',
			crypto: 'crypto-browserify',
			util: 'util'
		}
	},
	build: {
		target: 'esnext',
		rollupOptions: {
			plugins: [inject({ Buffer: ['buffer', 'Buffer'] }), nodePolyfills({ crypto: true })]
		}
	},
	server: {
		host: true
	}
};

export default config;
