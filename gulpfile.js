// после подключения sass в проект с пом. команды npm i gulp-sass --save-dev
// нужно подключить sass в файл gulpfile.js - sass = require('gulp-sass')
// в скобках указываем что подключаем. 'gulp-sass' - подключаем sass-пакет

var gulp = require('gulp'),  // Подключаем Gulp
    sass = require('gulp-sass'),  // Подключаем Sass пакет
    browserSync = require('browser-sync'), // Подключаем Browser Sync
    concat = require('gulp-concat'),  // Подключаем gulp-concat (для конкатенации файлов)
    uglify = require('gulp-uglifyjs');  // Подключаем gulp-uglifyjs (для сжатия JS)
    cssnano = require('gulp-cssnano'),  // Подключаем пакет для минификации CSS
    rename = require('gulp-rename'),  // Подключаем библиотеку для переименования файлов
    del = require('del'),  // Подключаем библиотеку для удаления файлов и папок
    imagemin = require('gulp-imagemin'),  // Подключаем библиотеку для работы с изображениями
    pngquant = require('imagemin-pngquant'),  // Подключаем библиотеку для работы с png
    cache = require('gulp-cache'),  // Подключаем библиотеку кеширования
    autoprefixer = require('gulp-autoprefixer');  // Подключаем библиотеку для автоматического добавления префиксов 
    
// таск для отслеживания изменений в Sass
// Если файл Sass обновляется, автоматически инжектим в HTML измененный CSS файл
gulp.task('sass', function() {  // Создаем таск "sass"
    return gulp.src('app/sass/**/*.sass')  // Берем источник. Берем все sass файлы из папки sass и дочерних, если таковые будут
      .pipe(sass())  // Преобразуем Sass в CSS посредством gulp-sass
      .pipe(autoprefixer(['last 15 versions', '> 1%', 'ie 8', 'ie 7'], { cascade: true }))  // Создаем префиксы.
                                                                                            // Будем использовать 15 поcледних
                                                                                            // версий всех браузеров для поддержки
                                                                                            // и сделаем каcкадирование
                                                                                            // для читабельного кода
      .pipe(gulp.dest('app/css'))  // Выгружаем результат в папку app/css
      .pipe(browserSync.reload({stream: true}))  // Обновляем CSS на странице при изменении
});
// (выполним таск sass в консоли командой gulp sass)
// (после чего Sass будет преобразован в CSS)

// таск для Browser Sync (производить LiveReload страниц при сохранении файлов)
gulp.task('browser-sync', function() {  // Создаем таск browser-sync
    browserSync({  // Выполняем browser Sync
        server: {  // Определяем параметры сервера
            baseDir: 'app'  // Директория для сервера - app
        },
        notify: false  // Отключаем уведомления
    });
});

// таск для сборки и сжатия всех библиотек
gulp.task('scripts', function() {
    return gulp.src([  // Берем все необходимые библиотеки
        'app/libs/jquery/dist/jquery.min.js',  // Берем jQuery
        'app/libs/magnific-popup/dist/magnific-popup.min.js'  // Берем Magnific Popup
    ])
    .pipe(concat('libs.min.js'))  // Собираем их в кучу (конкатинируем) в новом файле libs.min.js
    .pipe(uglify())  // Сжимаем JS файл
    .pipe(gulp.dest('app/js'));  // Выгружаем в папку app/js
});

// таск css-libs для минификации CSS
gulp.task('css-libs', ['sass'], function() {
    return gulp.src('app/css/libs.css')  // Выбираем файл для минификации
    .pipe(cssnano())  // Сжимаем
    .pipe(rename({suffix: '.min'}))  // Добавляем суффикс .min
    .pipe(gulp.dest('app/css'));  // Выгружаем в папку app/css
});

// таск для наблюдения за всеми необходимыми файлами
// главный таск для работы над проектом в режиме "онлайн"
gulp.task('watch', ['browser-sync', 'css-libs', 'scripts'], function() { // browser-sync и sass нужно выполнить до того,
                                                                         // как будет выполняться watch и до запуска сервера,
                                                                         // поэтому в [] указываем параметры, кот. будут выполняться
                                                                         // до того как выполнится watch. 
                                                                         // Выполнение browser-sync и sass необходимо для корректного
                                                                         // отображения изменений на момент запуска сервера
    gulp.watch('app/sass/**/*.sass', ['sass'])  // Наблюдение за sass файлами
                                            // Если происходят изменения в файлах sass, мы выполняем такс sass
    gulp.watch('app/*.html', browserSync.reload)  // Наблюдение за HTML файлами в корне проекта
    gulp.watch('app/js/**/*.js', browserSync.reload)  // Наблюдение за JS файлами в папке js (во всех директориях и поддиректориях)
});
// при запуске task 'watch' будет включаться browser-sync и browser-sync

// таск очистки clean, кот. будет чистить папку dist
gulp.task('clean', function() {
    return del.sync('dist');  // Удаляем папку dist перед сборкой
});

// таск img для сжатия изображений на продакшен
// вызываем его после очистки
gulp.task('img', function() {
    return gulp.src('app/img/**/*')  // Берем все изображения из app
    .pipe(cache(imagemin({  // // Сжимаем их с наилучшими настройками с учетом кеширования
        interlaced: true,
        prigressive: true,
        svgoPlugins: [{removeViewBox: false}],
        use: [pngquant()]
    })))
    .pipe(gulp.dest('dist/img'));  // Выгружаем на продакшен
});

// таск продакшена (сборки в папку dist)
// главный таск для сборки проекта на продакшен без лишних файлов, папок и со сжатыми картинками
gulp.task('build', ['clean', 'img', 'sass', 'scripts'], function() {

    var buildCss = gulp.src([  // Переносим CSS стили в продакшен
        'app/css/main.css',
        'app/css/libs.min.css'
    ])
    .pipe(gulp.dest('dist/css'));

    var buildFonts = gulp.src('app/fonts/**/*')  // Переносим шрифты в продакшен
    .pipe(gulp.dest('dist/fonts'));

    var buildJs = gulp.src('app/js/**/*')  // Переносим скрипты в продакшен
    .pipe(gulp.dest('dist/js'));

    var buildHtml = gulp.src('app/*.html')  // Переносим HTML в продакшен
    .pipe(gulp.dest('dist'));  // Выгружаем на продакшен
});
// присваивая переменным какие-либо действия, мы их выполняем

// таск для очистки кеша Gulp
gulp.task('clear', function() {
    return cache.clearAll();
});

// Так как чаще всего нам нужен будет таск watch, можно повесить его на дефолтный таск,
// чтобы не писать в консоли постоянно gulp watch, а писать просто gulp
gulp.task('default', ['watch']);

// Суть сводится к тому, что мы берем файл, что-то с ним делаем и выводим куда-то результат. Это вся задача gulp