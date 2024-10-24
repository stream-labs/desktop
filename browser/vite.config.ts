import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import * as path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
                              css: {
                                preprocessorOptions: {
                                  less: {
                                    // Less options go here
                                    // For example, enable JavaScript in Less files
                                    javascriptEnabled: true,
                                  },
                                },
                              },
                              resolve: {
                                alias: {
                                  '@': path.resolve(__dirname, 'src')
                                }
                              }
})
