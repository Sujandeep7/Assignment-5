const fs = require("fs");

const Sequelize = require('sequelize');
const {Op} = require('sequelize');


var sequelize = new Sequelize('fdfeigut', 'fdfeigut', 'SiKSQ_y4GHa1Wqng39CYsxjiJ0a85BhC', {
  host: 'isilo.db.elephantsql.com',
  dialect: 'postgres',
  port: 5432,
  dialectOptions: {
    ssl: { rejectUnauthorized: false }
  },
  query: { raw: true }
});

// Define the Category model
const Category = sequelize.define('category', {
  category: Sequelize.STRING
});

// Define the Post model
const Post = sequelize.define('Post', {
  body: Sequelize.TEXT,
  title: Sequelize.STRING,
  postDate: Sequelize.DATE,
  featureImage: Sequelize.STRING,
  published: Sequelize.BOOLEAN
});

// Define the belongsTo relationship between Post and Category
Post.belongsTo(Category, { foreignKey: 'Category' });



function initialize() {
  return new Promise((resolve, reject) => {
    sequelize.sync()
      .then(() => {
        console.log('Database connected and models synchronized');
        resolve();
      })
      .catch(err => {
        console.error('Unable to sync the database:', err);
        reject('Unable to sync the database');
      });
  });
}

function getAllPosts() {
  return new Promise((resolve, reject) => {
    Post.findAll()
      .then(posts => {
        if (posts.length > 0) {
          console.log(`Found ${posts.length} posts`);
          resolve(posts);
        } else {
          console.log('No results returned');
          reject('No results returned');
        }
      })
      .catch(err => {
        console.error('Unable to retrieve posts:', err);
        reject('Unable to retrieve posts');
      });
  });
}

function getPostsByCategory(category) {
  return new Promise((resolve, reject) => {
    Post.findAll({ where: { category } })
      .then(posts => {
        if (posts.length > 0) {
          resolve(posts);
        } else {
          reject("no results returned");
        }
      })
      .catch(err => reject(err));
  });
}

function getPostsByMinDate(minDateStr) {
  return new Promise((resolve, reject) => {
    Post.findAll({
      where: {
        postDate: { [Op.gte]: new Date(minDateStr) }
      }
    })
      .then(posts => {
        if (posts.length > 0) {
          resolve(posts);
        } else {
          reject("no results returned");
        }
      })
      .catch(err => reject(err));
  });
}

function getPostById(id) {
  return new Promise((resolve, reject) => {
    Post.findAll({ where: { id } })
      .then(posts => {
        if (posts.length > 0) {
          resolve(posts[0]);
        } else {
          reject("no results returned");
        }
      })
      .catch(err => reject(err));
  });
}

function addPost(postData) {
  postData.published = postData.published ? true : false;
  for (const prop in postData) {
    if (postData[prop] === "") {
      postData[prop] = null;
    }
  }
  postData.postDate = new Date();
  return new Promise((resolve, reject) => {
    Post.create(postData)
      .then(() => resolve())
      .catch(err => reject("unable to create post"));
  });
}

function getPublishedPosts() {
  return new Promise((resolve, reject) => {
    Post.findAll({ where: { published: true } })
      .then(posts => {
        if (posts.length > 0) {
          resolve(posts);
        } else {
          reject("no results returned");
        }
      })
      .catch(err => reject(err));
  });
}

function getPublishedPostsByCategory(category) {
  return new Promise((resolve, reject) => {
    Post.findAll({ where: { published: true, category } })
      .then(posts => {
        if (posts.length > 0) {
          resolve(posts);
        } else {
          reject("no results returned");
        }
      })
      .catch(err => reject(err));
  });
}

function getCategories() {
  return new Promise((resolve, reject) => {
    Category.findAll()
      .then(categories => {
        if (categories.length > 0) {
          resolve(categories);
        } else {
          reject("no results returned");
        }
      })
      .catch(err => reject(err));
  });
}

function addCategory(categoryData) {
  // Replace "" with null
  Object.keys(categoryData).forEach((key) => {
    if (categoryData[key] === "") {
      categoryData[key] = null;
    }
  });

  return Category.create(categoryData)
    .then(() => {
      return Promise.resolve();
    })
    .catch(() => {
      return Promise.reject("unable to create category");
    });
}

function deleteCategoryById(id) {
  return Category.destroy({ where: { id } })
    .then(() => {
      return Promise.resolve();
    })
    .catch(() => {
      return Promise.reject("unable to delete category");
    });
}

function deletePostById(id) {
  return Post.destroy({ where: { id } })
    .then(() => {
      return Promise.resolve();
    })
    .catch(() => {
      return Promise.reject("unable to delete post");
    });
}






/*

let posts = [];
let categories = [];

module.exports.initialize = function () {
  return new Promise((resolve, reject) => {
    fs.readFile("./data/posts.json", "utf8", (err, data) => {
      if (err) {
        reject(err);
      } else {
        posts = JSON.parse(data);

        fs.readFile("./data/categories.json", "utf8", (err, data) => {
          if (err) {
            reject(err);
          } else {
            categories = JSON.parse(data);
            resolve();
          }
        });
      }
    });
  });
};

module.exports.getAllPosts = function () {
  return new Promise((resolve, reject) => {
    posts.length > 0 ? resolve(posts) : reject("no results returned");
  });
};

module.exports.getPostsByCategory = function (category) {
  return new Promise((resolve, reject) => {
    let filteredPosts = posts.filter((post) => post.category == category);

    if (filteredPosts.length == 0) {
      reject("no results returned");
    } else {
      resolve(filteredPosts);
    }
  });
};

module.exports.getPostsByMinDate = function (minDateStr) {
  return new Promise((resolve, reject) => {
    let filteredPosts = posts.filter(
      (post) => new Date(post.postDate) >= new Date(minDateStr)
    );

    if (filteredPosts.length == 0) {
      reject("no results returned");
    } else {
      resolve(filteredPosts);
    }
  });
};

module.exports.getPostById = function (id) {
  return new Promise((resolve, reject) => {
    let foundPost = posts.find((post) => post.id == id);

    if (foundPost) {
      resolve(foundPost);
    } else {
      reject("no result returned");
    }
  });
};

module.exports.addPost = function (postData) {
  return new Promise((resolve, reject) => {
    postData.published = postData.published ? true : false;
    postData.id = posts.length + 1;
    postData.postDate = new Date().toISOString().slice(0, 10);
    posts.push(postData);
    resolve();
  });
};

module.exports.getPublishedPosts = function () {
  return new Promise((resolve, reject) => {
    let filteredPosts = posts.filter((post) => post.published);
    filteredPosts.length > 0
      ? resolve(filteredPosts)
      : reject("no results returned");
  });
};

module.exports.getCategories = function () {
  return new Promise((resolve, reject) => {
    categories.length > 0 ? resolve(categories) : reject("no results returned");
  });
};
module.exports.getPublishedPostsByCategory = function (category) {
  return new Promise((resolve, reject) => {
    const filteredPosts = posts.filter(
      (post) => post.published && post.category === category
    );
    filteredPosts.length > 0
      ? resolve(filteredPosts)
      : reject("no results returned");
  });
};
*/

module.exports = {
  initialize,
  getAllPosts,
  getPublishedPosts,
  getCategories,
  addPost,
  getPostById,
  getPostsByCategory,
  getPostsByMinDate,
  getPublishedPostsByCategory,
  addCategory,
  deleteCategoryById,
  deletePostById
};