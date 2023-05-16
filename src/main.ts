import type {
	OutputPlugin,
} from 'rollup';

const resolve = require('@rollup/plugin-node-resolve');

const terser = require('@rollup/plugin-terser');
const typescript = require('@rollup/plugin-typescript');

const filesize = require('rollup-plugin-filesize');
const uglify = require('uglify-js');

export interface MicroWebConfig {
	include?: string;
}

module.exports = {
	microWeb(gc_microweb: MicroWebConfig={}): OutputPlugin[] {
		return [
			// node-style resolution
			resolve({
				browser: true,
			}),

			// enable typescript
			typescript({
				sourceMap: true,
				include: gc_microweb.include || 'src/**/*.ts',
			}),

			// minify using terser
			...'development' !== process.env['NODE_ENV']? [
				terser({
					compress: {
						passes: 3,
						ecma: 2020,
						// toplevel: true,
						keep_fargs: false,
						unsafe_arrows: true,
						// unsafe_comps: true,
						unsafe_methods: true,
						unsafe_proto: true,
						unsafe_regexp: true,

						// this can cause an error when web crypto API expects a boolean
						// booleans_as_integers: true,
					},
					mangle: {
						toplevel: true,
					},
					format: {
						wrap_func_args: false,
					},
				}),

				// terser is not perfect on its own, use uglify to clean up remainder
				{
					name: 'uglify',
					generateBundle: {
						handler(gc_bundle, h_bundle, b_write) {
							for(const [, g_bundle] of Object.entries(h_bundle)) {
								if('chunk' === g_bundle.type) {
									g_bundle.code = uglify.minify(g_bundle.code).code;
								}
							}
						},
					},
				} as OutputPlugin,

				// display the bundled sizes
				filesize(),
			]: [],
		];
	}
}
