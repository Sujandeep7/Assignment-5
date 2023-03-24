/*********************************************************************************
* WEB322 – Assignment 04
* I declare that this assignment is my own work in accordance with Seneca Academic Policy. No part
* of this assignment has been copied manually or electronically from any other source
* (including 3rd party web sites) or distributed to other students.
*
* Name: Sujadeep Krishna Shrestha Student ID: 139745202 Date: 21/03/2023st
*
* Cyclic Web App URL: ________________________________________________________
*
* GitHub Repository URL: ______________________________________________________
*
********************************************************************************/

const express = require("express");
const blogData = require("./blog-service");
const multer = require("multer");
const cloudinary = require("cloudinary").v2;
const streamifier = require("streamifier");
var stripJs = require("strip-js");

const app = express();

const HTTP_PORT = process.env.PORT || 8081;

cloudinary.config({
  cloud_name: "cloud_name",
  api_key: "api_key",
  api_secret: "api_secret",
  secure: true,
});

const upload = multer();
const exphbs = require("express-handlebars");
app.engine(
  ".hbs",
  exphbs.engine({
    extname: ".hbs",
    helpers: {
      navLink: function (url, options) {
        return (
          "<li" +
          (url == app.locals.activeRoute ? ' class="active" ' : "") +
          '><a href="' +
          url +
          '">' +
          options.fn(this) +
          "</a></li>"
        );
      },
      equal: function (lvalue, rvalue, options) {
        if (arguments.length < 3)
          throw new Error("Handlebars Helper equal needs 2 parameters");
        if (lvalue != rvalue) {
          return options.inverse(this);
        } else {
          return options.fn(this);
        }
      },
      safeHTML: function (context) {
        return stripJs(context);
      },
    },
  })
);
app.set("view engine", ".hbs");

app.use(function (req, res, next) {
  let route = req.path.substring(1);
  app.locals.activeRoute =
    "/" +
    (isNaN(route.split("/")[1])
      ? route.replace(/\/(?!.*)/, "")
      : route.replace(/\/(.*)/, ""));
  app.locals.viewingCategory = req.query.category;
  next();
});

app.use(express.static("public"));

app.get("/", (req, res) => {
  res.redirect("/about");
});

app.get("/about", (req, res) => {
  res.render("about");
});

/*
app.get("/blog", (req, res) => {
  blogData
    .getPublishedPosts()
    .then((data) => {
      res.render("posts", { posts: data });
    })
    .catch((err) => {
      res.render("posts", { message: "no results" });
    });
});
*/

app.get("/blog", async (req, res) => {
  // Declare an object to store properties for the view
  let viewData = {};

  try {
    // declare empty array to hold "post" objects
    let posts = [];

    // if there's a "category" query, filter the returned posts by category
    if (req.query.category) {
      // Obtain the published "posts" by category
      posts = await blogData.getPublishedPostsByCategory(req.query.category);
    } else {
      // Obtain the published "posts"
      posts = await blogData.getPublishedPosts();
    }

    // sort the published posts by postDate
    posts.sort((a, b) => new Date(b.postDate) - new Date(a.postDate));

    // get the latest post from the front of the list (element 0)
    let post = posts[0];

    // store the "posts" and "post" data in the viewData object (to be passed to the view)
    viewData.posts = posts;
    viewData.post = post;
  } catch (err) {
    viewData.message = "no results";
  }

  try {
    // Obtain the full list of "categories"
    let categories = await blogData.getCategories();

    // store the "categories" data in the viewData object (to be passed to the view)
    viewData.categories = categories;
  } catch (err) {
    viewData.categoriesMessage = "no results";
  }

  // render the "blog" view with all of the data (viewData)
  console.log(viewData);
  res.render("blog", { data: viewData });
});

app.get("/blog/:id", async (req, res) => {
  // Declare an object to store properties for the view
  let viewData = {};

  try {
    // declare empty array to hold "post" objects
    let posts = [];

    // if there's a "category" query, filter the returned posts by category
    if (req.query.category) {
      // Obtain the published "posts" by category
      posts = await blogData.getPublishedPostsByCategory(req.query.category);
    } else {
      // Obtain the published "posts"
      posts = await blogData.getPublishedPosts();
    }

    // sort the published posts by postDate
    posts.sort((a, b) => new Date(b.postDate) - new Date(a.postDate));

    // store the "posts" and "post" data in the viewData object (to be passed to the view)
    viewData.posts = posts;
  } catch (err) {
    viewData.message = "no results";
  }

  try {
    // Obtain the post by "id"
    viewData.post = await blogData.getPostById(req.params.id);
  } catch (err) {
    viewData.message = "no results";
  }

  try {
    // Obtain the full list of "categories"
    let categories = await blogData.getCategories();

    // store the "categories" data in the viewData object (to be passed to the view)
    viewData.categories = categories;
  } catch (err) {
    viewData.categoriesMessage = "no results";
  }

  // render the "blog" view with all of the data (viewData)
  res.render("blog", { data: viewData });
});

app.get("/", (req, res) => {
  res.redirect("/blog");
});

app.get("/posts", (req, res) => {
  let queryPromise = null;

  if (req.query.category) {
    queryPromise = blogData.getPostsByCategory(req.query.category);
  } else if (req.query.minDate) {
    queryPromise = blogData.getPostsByMinDate(req.query.minDate);
  } else {
    queryPromise = blogData.getAllPosts();
  }

  queryPromise
    .then((data) => {
      console.log(data);

      res.render("posts", { posts: data });
    })
    .catch((err) => {
      res.render("posts", { message: "no results" });
    });
});

app.post("/posts/add", upload.single("featureImage"), (req, res) => {
  if (req.file) {
    let streamUpload = (req) => {
      return new Promise((resolve, reject) => {
        let stream = cloudinary.uploader.upload_stream((error, result) => {
          if (result) {
            resolve(result);
          } else {
            reject(error);
          }
        });

        streamifier.createReadStream(req.file.buffer).pipe(stream);
      });
    };

    async function upload(req) {
      let result = await streamUpload(req);
      console.log(result);
      return result;
    }

    upload(req).then((uploaded) => {
      processPost(uploaded.url);
    });
  } else {
    processPost("");
  }

  function processPost(imageUrl) {
    req.body.featureImage = imageUrl;

    blogData
      .addPost(req.body)
      .then((post) => {
        res.redirect("/posts");
      })
      .catch((err) => {
        res.status(500).send(err);
      });
  }
});

app.get("/posts/add", (req, res) => {
  res.render("addPost.hbs");
});

app.get("/post/:id", (req, res) => {
  blogData
    .getPostById(req.params.id)
    .then((data) => {
      res.render("posts", { posts: data });
    })
    .catch((err) => {
      res.render("posts", { message: "no results" });
    });
});

app.get("/categories", (req, res) => {
  blogData
    .getCategories()
    .then((data) => {
      res.render("category", { categories: data });
    })
    .catch((err) => {
      res.render("posts", { message: "no results" });
    });
});

app.use((req, res) => {
  res.status(404).render("404");
});

blogData
  .initialize()
  .then(() => {
    app.listen(HTTP_PORT, () => {
      console.log("server listening on: " + HTTP_PORT);
    });
  })
  .catch((err) => {
    console.log(err);
  });
