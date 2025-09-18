// Importamos los modulos
import { src, dest, watch, series } from 'gulp';
import * as dartSass from 'sass';
import gulpSass from 'gulp-sass';

import imagemin from 'imagemin';
import imageminJpegtran from 'imagemin-jpegtran';
import imageminPngquant from 'imagemin-pngquant';
import imageminWebp from 'imagemin-webp';



// Creamos una instancia de gulp-sass diciendole que use DartSass como compilador
const sass = gulpSass(dartSass);

// Funcion para optimizar las imagenes subidas
export async function img() {
    // Optimiza JPG y PNG
    const files = await imagemin(['src/img/*.{jpg,png}'], {
        destination: 'public/dist/img',
        plugins: [
            imageminJpegtran(),
            imageminPngquant({
                quality: [0.6, 0.8]
            })
        ]
    });
    // Genera WebP
    const webpFiles = await imagemin(['src/img/*.{jpg,png}'], {
        destination: 'public/dist/img',
        plugins: [
            imageminWebp({ quality: 75 })
        ],
        rename: { extname: '.webp' }
    });
    console.log(`Imagenes optimizadas: ${files.length}, WebP generadas: ${webpFiles.length}`);
}

// Funcion para procesar los archivos de JavaScript
export function js(done) {
    src('src/js/**/*.js') // Buscamos todos los archivos/subcarpetas en src/js
        .pipe( dest('public/dist/js')); // Compilamos los archivos a dist/js
    done(); // Terminamos la tarea
}

// Funcion para procesar los archivos de Sass a CSS
export function css(done) {
    src('src/scss/index.scss', { sourcemaps: true}) // Tomamos el archivo principal SCSS
        .pipe( sass().on('error', sass.logError)) // Compilamos Sass y manejamos errores
        .pipe( dest('public/dist/css', {sourcemaps: '.'})); // Guardamos el CSS en public/dist/css con sourcemaps
    done(); 
}

// Funcion para observar los cambios en timpo real 
export function dev() {
    watch('src/img/**/*', img); // Observamos los cambios de las imagenes para optimizarlas img()
    watch('src/scss/**/*.scss', css); // Observamos los cambios en archivos SCSS y ejecutamos css()
    watch('src/js/**/*.js', js); // Observamos los cambios en archivos JS y ejecutamos js()
}

// Tarea predeterminada
export default series(img, js, css, dev);