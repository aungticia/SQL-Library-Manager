var express = require('express');
var router = express.Router();

var createError = require('http-errors');

const { Op } = require('../models').Sequelize;
const { Book } = require('../models');

// Handler function to wrap each route.
function asyncHandler(cb){
  return async(req, res, next) => {
    try {
      await cb(req, res, next)
    } catch(error){
      const err = createError(500, 'Sorry! There was an unexpected error on the server.');
      next(err);
    }
  }
};

// ROUTES 

// GET redirect to the first page in list pagination 
router.get('/', asyncHandler(async (req, res, next) => {
  res.redirect('/books/1')
}));

// GET all books from database
router.get('/:page', asyncHandler(async (req, res, next) => {
  
  const pageNum = parseInt(req.params.page);
  const pageLimit = 6;

  const { count, rows } = await Book.findAndCountAll({
    order: [['title', 'ASC']],
    limit: pageLimit,
    offset: pageLimit * (pageNum - 1), 
  });

  const bookList = rows.map( book => book.dataValues );
  const pages = Math.ceil( count / pageLimit );


  if (bookList.length > 0) {
    res.render('index', { bookList, pages, search: {} });  
  } else {
    throw error;
  }

}));

// POST search and render search results
router.post('/', asyncHandler(async (req, res, next) => {
  const searchTerm = req.body.search;
  const searchResults = await Book.findAll({
    where: {
      [Op.or]: [
        {title: { [Op.substring]: searchTerm }}, 
        {author: { [Op.substring]: searchTerm }}, 
        {genre: { [Op.substring]: searchTerm }}, 
        {year: searchTerm}
      ]
    }
  });

  if(searchResults.length > 0) {
    res.render('results', { searchResults, search: {} });
  } else {
    res.render('noresults', { search: {} });
  }

}));

// GET books/new renders create new-book form 
router.get('/new/create', (req, res) => {
  res.render('new-book', { book: {} });
});

// POST books/new posts a new book to the database
router.post('/new', asyncHandler(async (req, res, next) => {
  let book;
  try {
    book = await Book.create(req.body);
    res.redirect('/');
  } catch (error) {
    if (error.name === "SequelizeValidationError") {
      book = await Book.build(req.body);
      res.render('new-book', { book, errors: error.errors });
    } else {
      throw error;
    }
  };
}));

// GET books/:id shows update-book form
router.get('/:id/update', asyncHandler(async (req, res, next) => {
  const book = await Book.findByPk(req.params.id);
  if (book) {
    res.render('update-book', { book })
  } else {
    throw error;
  };
}));

// POST books/:id Updates book info in the database
router.post('/:id/update', asyncHandler(async (req, res, next) => {
  let book;
  try {
    book = await Book.findByPk(req.params.id);
    if (book) {
      await book.update(req.body);
      res.redirect('/');
    } else {
      throw error;
    };
  } catch (error) {
    if (error.name === "SequelizeValidationError") {
      book = await Book.build(req.body);
      book.id = req.params.id;
      res.render('update-book', { book, errors: error.errors });
    } else {
      throw error;
    };
  };
}));

// Delete book form. 
router.get("/:id/delete", asyncHandler(async (req, res) => {
  const book = await Book.findByPk(req.params.id);
  if(book) {
    res.render("delete", { book });
  } else {
    throw error;
  };
}));

// Delete individual book
router.post('/:id/delete', asyncHandler(async (req ,res) => {
  const book = await Book.findByPk(req.params.id);
  if(book) {
    await book.destroy();
    res.redirect("/books");  
  } else {
    throw error;
  };
}));

module.exports = router;