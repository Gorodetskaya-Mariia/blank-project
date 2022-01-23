const gulp = require("gulp"),
  sass = require("gulp-sass"),
  babel = require("gulp-babel"),
  htmlbeautify = require("gulp-html-beautify"),
  plumber = require("gulp-plumber"), //ловим ошибки
  autoprefix = require("gulp-autoprefixer"), //добавление вендорных префиксов
  imagemin = require("gulp-imagemin"), //минификация изображений
  newer = require("gulp-newer"), //отслеживание изменнённых и нетронутых файлов
  wait = require("gulp-wait"),
  del = require("del"), //удаление файлов и папок
  browserSync = require("browser-sync"), //autoreload страниц
  reload = browserSync.reload,
  svgstore = require("gulp-svgstore"),
  sourcemap = require("gulp-sourcemaps"),
  csso = require("gulp-csso"),
  webp = require("gulp-webp");

const path = {
  source: {
    styles: [
      "./src/sass/styles.scss",
    ],
    favicons: "./src/favicon/**.*",
    img: "./src/images/**/*.*",
    html: "./src/pages/*.html",
    js: "./src/js/*.js",
    fonts: "./src/fonts/*.{ttf,woff,woff2,eof,svg}",
  },
  build: {
    styles: "./build/css/",
    js: "./build/js/",
    img: "./build/images/",
    html: "./build/pages/",
    fonts: "./build/fonts/",
    favicons: "./build/",
  },
  watch: {
    html: "./src/pages/**/*.html",
    styles: "./src/sass/**/*.scss",
    img: "./src/images/**/*.*",
    js: "./src/js/**/*.js",
  },
  clean: "./build/**/**.*",
};

gulp.task("clean", function () {
  return del(path.clean);
});

gulp.task("browser-sync", function () {
  browserSync.init({
    open: "ui",
    browser: "chrome",
    server: {
      baseDir: "./",
      directory: true,
    },
    startPath: "./build/pages",
    port: 8084,
    cors: true,
    notify: false,
    files: ["./src/*.*"],
  });
});

gulp.task("js:build", function () {
  return  gulp
    .src(path.source.js)
    .pipe(babel({
      presets: ["@babel/env"]
    }))
    .pipe(gulp.dest(path.build.js))
    .pipe(reload({ stream: true }));
});

gulp.task("fonts:build", function () {
  return gulp
    .src(path.source.fonts)
    .pipe(gulp.dest(path.build.fonts))
    .pipe(reload({ stream: true }));
});

gulp.task("styles:build", function () {
  return gulp
    .src(path.source.styles)
    .pipe(wait(300))
    .pipe(newer(path.build.styles))
    .pipe(plumber({
      errorHandler: function (err) {
        console.log(err.message);
        this.emit('end');
      }
    }))
    .pipe(sourcemap.init())
    .pipe(sass())
    .pipe(autoprefix())
    .pipe(csso())
    .pipe(sourcemap.write("."))
    .pipe(gulp.dest(path.build.styles))
    .pipe(reload({ stream: true }));
});

gulp.task("img:build", function () {
  return gulp
    .src(path.source.img, { base: "./src/images/" })
    .pipe(newer(path.build.img))
    .pipe(gulp.dest(path.build.img))
    .pipe(reload({ stream: true }));
});

gulp.task("img:webp", function () {
  return gulp
    .src(path.source.img, {base: "./src/images/"})
    .pipe(webp({quality: 90}))
    .pipe(gulp.dest(path.build.img))
});

gulp.task("img:minify", function () {
  return gulp
    .src(`${path.build.img}**/*.{jpg,png,gif,webp,svg}`)
    .pipe(
      imagemin({
        progressive: true,
        svgoPlugins: [{ removeViewBox: false }],
        interlaced: true,
      })
    )
    .pipe(gulp.dest(path.build.img))
})

gulp.task("favicons", function () {
  return gulp
    .src(path.source.favicons)
    .pipe(gulp.dest(path.build.favicons));
})

gulp.task("htmlbeautify", function () {
  var options = { indentSize: 2 };
  return gulp
    .src(path.source.html)
    .pipe(htmlbeautify(options))
    .pipe(gulp.dest(path.build.html))
    .pipe(reload({ stream: true }));
});

gulp.task(
  "build",
  gulp.series(
    gulp.parallel("img:build", "img:webp", "fonts:build", "favicons"),
    gulp.parallel("js:build"),
    gulp.parallel("styles:build"),
    "htmlbeautify"
  )
);

gulp.task("watch", function () {
  gulp.watch(path.watch.html, gulp.series("htmlbeautify")).on('change', reload);
  gulp.watch(path.watch.styles, gulp.series("styles:build"));
  gulp.watch(path.watch.img, gulp.series("img:build", "img:webp"));
  gulp.watch(path.watch.js, gulp.series("js:build"));
});


gulp.task(
  "default",
  gulp.series("clean", "build", gulp.parallel("watch", "browser-sync"))
);

gulp.task(
  "imagemin",
  gulp.series("img:minify")
);

gulp.task(
  "production",
  gulp.series("clean", "build", "imagemin")
);
