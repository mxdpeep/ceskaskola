/* Copyright (c) 2007 Google Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

var lastBlogTitle = '';
var lastBlogId = -1;

/**
 * Authorizing to this URL enables us full access to user's blog feeds.
 * @type {String}
 */
var BLOGGER_AUTH_URL = 'https://www.blogger.com/feeds';

/**
 * This is the URL to query to get a list of the user's blogs
 * @type {String}
 */
var BLOGGER_LIST_URL = 'https://www.blogger.com/feeds/default/blogs';

/**
 * This object holds all the global variables used throughout the program.
 * @type {Object}
 */
var BlogPress = {
  /**
   * This becomes the google.gdata.blogger.BloggerService object that
   * we later perform insert/update/delete/get operations on.
   * @type {Object}
   */
  service: null,
  /**
   * This holds google.gdata.blogger.BlogFeed objects, the users' blogs.
   * @type {Array}.<Object>
   */
  blogs: [],
  /**
   * This holds google.gdata.blogger.BlogEntry objects, the blog feed entries.
   * @type {Array}.<Object>
   */
  blogFeeds: [],
  /**
   * This keeps track of the currently selected blog's index in blogs array.
   * @type {Number}
   */
  currentBlogNum: 0
};

/**
 * This is used for setting the view mode in the app, by switchView.
 * @enum {Number}
 */
var BP_VIEWMODE = {
  SHOWPOSTS: 0,
  CREATEPOST: 1,
  EDITPOST: 2
};

/**
 * These are the IDs for the various DOM elements used by the JS.
 * @enum {String}
 */
var BP_ID = {
  SHOWPOST_TAB: 'sublink0',
  SHOWPOST_LINK: 'sublink0a',
  SHOWPOST_BLOCK: 'showAllPostsDiv',
  CREATEPOST_TAB: 'sublink1',
  CREATEPOST_LINK: 'sublink1a',
  CREATEPOST_BLOCK: 'createOrEditDiv',
  DRAFT_BUTTON: 'draftButton',
  PUBLISH_BUTTON: 'publishButton',
  AUTH_BUTTON: 'authButton',
  FORM_EDITURI: 'blogPostEditUri',
  FORM_TITLE: 'blogPostTitleInput',
  FORM_CONTENT: 'blogPostTextArea',
  FORM_TAGS: 'blogPostCategoriesInput',
  FORM_UPDATED: 'blogPostUpdatedInput',
  AUTH_BLOCK: 'loginNotice',
  SWITCHER: 'switcher',
  PREVIEW: 'preview',
  CONTROLS: 'controls',
  BLOG_DROPDOWN: 'blogSelect',
  ART_DROPDOWN: 'artSelect',
};

/**
 * These are the hexadecimal color strings for the on/off tab states.
 * @enum {String}
 */
var BP_COLOR = {
  TAB_ON: '#0d324f',
  TAB_OFF: '#83b4d8',
  LINK_ON: '#fff',
  LINK_OFF: '#000'
};
 

/**
 * Short alias for document.getElementById.
 * @param {String} id The ID of the element.
 * @return {Element} The DOM element for that ID.
 */
function el(id) {
  return document.getElementById(id);
};

/**
 * Logging function. To make it easy to change logging method.
 * @param {String} status Message to display
 */
function changeStatus(status) {
  if (status)
  {
    $('#statusDiv').fadeOut(5, function()
	{
		$('#statusDiv').html(status);
		$('#statusDiv').fadeIn(500);
	});
  }
  else
  {
    $('#statusDiv').slideUp(500, function()
	{
		$('#statusDiv').html('');
	});
  }
};

/**
 * This function checks if the user is logged in,
 * and changes the login button and displayed sections accordingly.
 * It also initializes the BlogPress.service variable
 * and calls a function to fill in the form based on the URL.
 */
function init() {
  BlogPress.service = new google.gdata.blogger.BloggerService(
      'GoogleInc-bloggerOffline-1');

  if (google.accounts.user.checkLogin(BLOGGER_AUTH_URL)) {
    el(BP_ID.AUTH_BUTTON).value = 'odhlásit';
    el(BP_ID.SWITCHER).style.display = 'block';
    el(BP_ID.CONTROLS).style.display = 'block';
    setTimeout('getBlogs();', 1000);
	getArticles();
	loadListboxPosition();
    switchView(BP_VIEWMODE.CREATEPOST);
  } else {
    el(BP_ID.AUTH_BUTTON).value = 'přihlásit';
    el(BP_ID.SWITCHER).style.display = 'none';
    el(BP_ID.CONTROLS).style.display = 'none';
    $('#body').fadeIn(100, function()
	{
		$('#createOrEditDiv').fadeOut();
		$('#preview').fadeOut();
	});
  }
};

/**
 * This function is triggered by the login/logout button.
 * If the user is logged in to the app, it logs them out.
 * If the user is logged out to the app, it logs them in.
 */
function loginOrLogout(){
  var token = google.accounts.user.checkLogin(BLOGGER_AUTH_URL);
  if (token) {
    google.accounts.user.logout();
    init();
  } else {
    google.accounts.user.login(BLOGGER_AUTH_URL);
  }
};

/**
 * Retrieves the feed of all the user's blogs. 
 */
function getBlogs() {
  var query = new google.gdata.blogger.BlogQuery(BLOGGER_LIST_URL);
  BlogPress.service.getBlogFeed(query, handleBlogsFeed, handleError);
};

/**
 * Updates the current blog number when drop-down is changed.
 */
function updateCurrentBlogNum() {
  BlogPress.currentBlogNum = el(BP_ID.BLOG_DROPDOWN).value;
  lastBlogId = BlogPress.currentBlogNum;
  lastBlogTitle = BlogPress.blogs[BlogPress.currentBlogNum].title.getText();
  localStorage['blog'] = lastBlogTitle;
  displayBlogPosts(BlogPress.currentBlogNum);
};


/**
 * This function is called after the blogs feed query returns.
 * It parses through the entries, getting the necessary info and
 * filling the blogs dropdown.
 * @param {google.gdata.BlogFeed} resultsFeedRoot The blogs feed
 */
function handleBlogsFeed(resultsFeedRoot) {
  var blogsFeed = resultsFeedRoot.feed;
  BlogPress.blogs = blogsFeed.getEntries();

  if (typeof localStorage['blog'] !== "undefined")
  {
  	var lastBlogTitle = localStorage['blog'];
  }

  for (var i = 0; i < BlogPress.blogs.length; i++) {
    var blog = BlogPress.blogs[i];
    var blogTitle = blog.getTitle().getText();
    var blogSelect = el(BP_ID.BLOG_DROPDOWN);
    var blogOption = document.createElement('option');
	if (blogTitle == lastBlogTitle)
	{
		lastBlogId = i;
	}
    blogOption.setAttribute('value', i);
    blogOption.appendChild(document.createTextNode(blogTitle));
    blogSelect.appendChild(blogOption);
    //if (lastBlogId == -1) loadBlog(0);
    //if (lastBlogId == i) loadBlog(i);
	loadBlog(i);
  }

  // load last blog
  if (el(BP_ID.BLOG_DROPDOWN).value != lastBlogId)
  {
	el(BP_ID.BLOG_DROPDOWN).value = lastBlogId;
	updateCurrentBlogNum();
  }

  $('#sublink0').fadeIn();
};

/**
 * Loads the blog specified by num index. 
 * If it's the first blog, displays the posts.
 * @param {Number} num The index of the blog in blogs array.
 */
function loadBlog(num) {
  var blog = BlogPress.blogs[num];
  if (!blog) {
    return;
  }
  var blogPostHref = blog.getEntryPostLink().getHref();
  BlogPress.service.getBlogPostFeed(blogPostHref, function (resultsFeedRoot) {
    var postsFeed = resultsFeedRoot.feed;
    BlogPress.blogFeeds[num] = postsFeed;
    if (num == 0)
	{
		displayBlogPosts(num);
	}
  }, handleError);
};

/**
 * Displays the blog posts specified by num index.
 * @param {Number} blogNum The index of the blog whose posts to display.
 */
function displayBlogPosts(blogNum) {
  var blogPostsFeed = BlogPress.blogFeeds[blogNum];

  // If there are no posts in this blog feed, display message.
  if (blogPostsFeed.entry.length == 0) {
    el('showAllPostsDiv').innerHTML =
        'Nejsou zde žádné články.';
    return;
  }

  var table = document.createElement('table');
  var tbody = document.createElement('tbody');

  // Create the top row for the table.
  var th = document.createElement('tr');
  addRowCell(th, 'top size', document.createTextNode('publikováno'));
  addRowCell(th, 'top size', document.createTextNode('aktualizováno'));
  addRowCell(th, 'top', document.createTextNode('název'));
  addRowCell(th, 'top', document.createTextNode('kategorie'));
  addRowCell(th, 'top size', document.createTextNode('autor'));
  addRowCell(th, 'top', document.createTextNode(''));
  addRowCell(th, 'top', document.createTextNode(''));
  addRowCell(th, 'top', document.createTextNode(''));
  addRowCell(th, 'top', document.createTextNode(''));
  tbody.appendChild(th);

  // Iterate through the blog posts, displaying info for each.
  for (var i = 0; i < blogPostsFeed.entry.length; i++) {
    // Get the blog post information from the feed.
    var blogPost = blogPostsFeed.getEntries()[i];
    var title = blogPost.getTitle().getText();
    var author = blogPost.getAuthors()[0].getName().getValue();
    //var date = blogPost.getUpdated().getValue().getDate();
    //var date = blogPost.getUpdated().$t;
    var date = blogPost.getPublished().$t;
	var published = date.substring(0, 19);
    var date = blogPost.getUpdated().$t;
	var updated = date.substring(0, 19);

    // It will only have a comments link if it's published and
    // commenting is enabled for the blog.
    var commentsLinkHref = '';
    if (blogPost.getRepliesHtmlLink()) {
      commentsLinkHref = blogPost.getRepliesHtmlLink().getHref();
    }

    // We know it's a draft post if it doesn't have an html link.
    var isDraft = true;
    if (blogPost.getHtmlLink()) {
      isDraft = false;
      var htmlLinkHref = blogPost.getHtmlLink().getHref();
    }

    // Create a comma separated list of all the categories.
    var categoriesArray = []
    for (var c = 0; c < blogPost.getCategories().length; c++) {
      categoriesArray.push(blogPost.getCategories()[c].getTerm());
    }
    var categories = categoriesArray.join(', ');

    // Create the row with all the post information.
    var color = (i%2 == 0) ? 'odd' : 'even';

    var tr = document.createElement('tr');

    addRowCell(tr, color, document.createTextNode(published));
    addRowCell(tr, color, document.createTextNode(updated));
    addRowCell(tr, color, document.createTextNode(title));
    addRowCell(tr, color, document.createTextNode(categories));
    addRowCell(tr, color, document.createTextNode(author));

    // Create link to view post, if possible.
    if (!isDraft) {
      var viewA = document.createElement('a');
      viewA.setAttribute('href', htmlLinkHref);
      viewA.setAttribute('target', '_blank');
      viewA.appendChild(document.createTextNode('zobrazit'));
      addRowCell(tr, color, viewA);
    } else {
      addRowCell(tr, color, document.createTextNode('(návrh)'));
    }

    // Create edit-this-post link.
    var viewA = document.createElement('a');
    viewA.setAttribute('href', 'javascript:prepareEditView(' + i + ',' +
        isDraft + ')');
    viewA.appendChild(document.createTextNode('editovat'));

    // Create delete-this-post link.
    var viewA = document.createElement('a');
    viewA.setAttribute('href', 'javascript:deletePost(' + i + ')');
    viewA.appendChild(document.createTextNode('smazat'));
    addRowCell(tr, color, viewA);

    // Create comments link, if possible.
    if (commentsLinkHref != '') {
      var commentsA = document.createElement('a');
      commentsA.setAttribute('href', commentsLinkHref);
      commentsA.appendChild(document.createTextNode('komentáře'));
      addRowCell(tr, color, commentsA);
    } else {
      addRowCell(tr, color, document.createTextNode(''));
    }

    tbody.appendChild(tr);
  }
  table.appendChild(tbody);
  el('showAllPostsDiv').innerHTML = '';
  el('showAllPostsDiv').appendChild(table);
};

/**
 * Adds a TD to the given row with the given content node.
 * @param {Element} tr The row to append the created TD to.
 * @param {String} classname The name of the CSS class for this cell.
 * @param {Element} content The DOM node to append to the created TD.
 */
function addRowCell(tr, classname, content) {
  var td = document.createElement('td');
  td.className = classname;
  td.appendChild(content);
  tr.appendChild(td);
};

/*
 * Switches to create/edit/show posts view and mode.
 * @param {Number} viewNum Indicates which view to switch to.
 */
function switchView(viewNum) {
  switch(viewNum) {

  case BP_VIEWMODE.SHOWPOSTS:
    el(BP_ID.SHOWPOST_TAB).style.backgroundColor = BP_COLOR.TAB_ON;
    el(BP_ID.SHOWPOST_LINK).style.color = BP_COLOR.LINK_ON;
    el(BP_ID.CREATEPOST_TAB).style.backgroundColor = BP_COLOR.TAB_OFF;
    el(BP_ID.CREATEPOST_LINK).style.color = BP_COLOR.LINK_OFF;
    el(BP_ID.CREATEPOST_BLOCK).style.display = 'none';
   	$('#' + BP_ID.SHOWPOST_BLOCK).fadeIn(500);
    $('#' + BP_ID.CONTROLS).fadeOut(200);
    el(BP_ID.PREVIEW).style.display = 'none';
    loadBlog(BlogPress.currentBlogNum);
    break;

  case BP_VIEWMODE.CREATEPOST:
    el(BP_ID.SHOWPOST_TAB).style.backgroundColor = BP_COLOR.TAB_OFF;
    el(BP_ID.SHOWPOST_LINK).style.color = BP_COLOR.LINK_OFF;
    el(BP_ID.CREATEPOST_TAB).style.backgroundColor = BP_COLOR.TAB_ON;
    el(BP_ID.CREATEPOST_LINK).style.color = BP_COLOR.LINK_ON;
    el(BP_ID.SHOWPOST_BLOCK).style.display = 'none';
	$('#' + BP_ID.CREATEPOST_BLOCK).fadeIn(500);
    $('#' + BP_ID.CONTROLS).fadeIn(200);
    el(BP_ID.FORM_EDITURI).value = '';
    el(BP_ID.FORM_TITLE).value = '';
    el(BP_ID.FORM_CONTENT).value = '';
    el(BP_ID.FORM_TAGS).value = '';
    el(BP_ID.PUBLISH_BUTTON).value = 'publikovat';
    updatePreview();
    break;

  case BP_VIEWMODE.EDITPOST:
    el(BP_ID.SHOWPOST_TAB).style.backgroundColor = BP_COLOR.TAB_ON;
    el(BP_ID.SHOWPOST_LINK).style.color = BP_COLOR.LINK_ON;
    el(BP_ID.CREATEPOST_TAB).style.backgroundColor = BP_COLOR.TAB_OFF;
    el(BP_ID.CREATEPOST_LINK).style.color = BP_COLOR.LINK_OFF;
    el(BP_ID.SHOWPOST_BLOCK).style.display = 'none';
	$('#' + BP_ID.CREATEPOST_BLOCK).fadeIn(500);
    $('#' + BP_ID.CONTROLS).fadeIn(200);
    updatePreview();
    break;
  }

  $('#edTab').fadeIn(500);
};

/**
 * Reads the contents of the blog post form and sends it to the Blogger
 * servers as either a new blog post or an update of an old one.
 * @param {Boolean} isDraft Indicates whether this post is a draft.
 */
function insertOrUpdatePostEntry(isDraft) {
  // Get the values from the form.
  var title = el(BP_ID.FORM_TITLE).value;
  var content = el(BP_ID.FORM_CONTENT).value;
  var updated = el(BP_ID.FORM_UPDATED).value;
  var categoriesString = el(BP_ID.FORM_TAGS).value;
  var categoriesArray = categoriesString.split(',');

  // Create event object and set relevant properties.
  var blogPostEntry = new google.gdata.blogger.PostEntry();
  blogPostEntry.setTitle(google.gdata.atom.Text.create(title));
  blogPostEntry.setPublished(google.gdata.atom.Text.create(updated));
  blogPostEntry.setUpdated(google.gdata.atom.Text.create(updated));
  blogPostEntry.setContent(google.gdata.atom.Text.create(content, 'html'));

  for (var c = 0; c < categoriesArray.length; c++) {
    if (categoriesArray[c] != '') {
      var category = new google.gdata.atom.Category();
      category.setTerm(categoriesArray[c]);
      category.setScheme('http://www.blogger.com/atom/ns#');
      blogPostEntry.addCategory(category);
    }
  }

  if (isDraft) {
    var draft = new google.gdata.app.Draft();
    draft.setValue(google.gdata.app.Draft.VALUE_YES);
    var control = new google.gdata.app.Control();
    control.setDraft(draft);
    blogPostEntry.setControl(control);
  }

  var entryEditUri = el(BP_ID.FORM_EDITURI).value;
  if (entryEditUri != '') { // Editing an existent post.
    BlogPress.service.updateEntry(entryEditUri, blogPostEntry,
        handleEntryPost, handleError);
  } else { // Adding a new post.
    var currentBlog = BlogPress.blogs[BlogPress.currentBlogNum];
    var blogPostHref = currentBlog.getEntryPostLink().getHref();
    BlogPress.service.insertEntry(blogPostHref, blogPostEntry,
        handleEntryPost, handleError);
  }
};

/**
 * Deletes the n'th post in the current blog feed.
 * @param {Number} postNum The index of the post to delete.
 */
function deletePost(postNum) {
  var currentBlog = BlogPress.blogFeeds[BlogPress.currentBlogNum];
  var blogPostEntry = currentBlog.getEntries()[postNum];
  var entryEditHref = blogPostEntry.getEditLink().getHref();
  BlogPress.service.deleteEntry(entryEditHref, handleDeletePost, handleError);
};

/**
 * Prepare to go into edit view by pre-filling the form
 * with the post details.
 * @param {Number} postNum The index of the post to edit.
 * @param {Boolean} isDraft Indicates whether post to edit is a draft.
 */
function prepareEditView(postNum, isDraft) {
  var currentBlog = BlogPress.blogFeeds[BlogPress.currentBlogNum];
  var blogPostEntry = currentBlog.getEntries()[postNum];

  var editUri = blogPostEntry.getEditLink().getHref();
  var title = blogPostEntry.getTitle().getText();
  var content = blogPostEntry.getContent().getText();
  var updated = blogPostEntry.getUpdated().$t;
  var updated = updated.substring(0, 19) + '.000-00:00';

  var categoriesA = [];
  for (var c = 0; c < blogPostEntry.getCategories().length; c++) {
    categoriesA.push(blogPostEntry.getCategories()[c].getTerm());
  }
  var categories = categoriesA.join(', ');

  el(BP_ID.FORM_EDITURI).value = editUri;
  el(BP_ID.FORM_TITLE).value = title;
  el(BP_ID.FORM_CONTENT).value = content;
  el(BP_ID.FORM_TAGS).value = categories;
  el(BP_ID.FORM_UPDATED).value = updated.trim().substring(0, 19);

  el(BP_ID.PUBLISH_BUTTON).value = 'publikovat';

  switchView(BP_VIEWMODE.EDITPOST);
};

/**
 * This function is called when post is deleted.
 * It calls getBlogs to update the current blog feed list.
 * @param {google.gdata.blogger.BlogEntry} entryRoot
 */
function handleDeletePost() {
  changeStatus('Článek byl úspěšně smazán.');
  getBlogs();
};


/**
 * This function is called when a post is created or edited.
 * It calls getBlogs to update the current blog feed list.
 * @param {Object} entryRoot
 */
function handleEntryPost(entryRoot) {
  changeStatus('Článek byl úspěšně publikován.');

  // colorize
  $('#a' + articleContent.listbox).addClass('published');

  var blogPostEntry = entryRoot.entry;
  el(BP_ID.FORM_EDITURI).value = blogPostEntry.getEditLink().getHref();
  setTimeout("$('#btNext').click();", 500);
  switchView(BP_VIEWMODE.CREATEPOST);
};

/**
 * This function is called if an error is encountered
 * while retrieving a feed, adding, editing or deleting an entry.
 * @param {Object} error
 */
function handleError(error) {
  changeStatus(error.cause ? error.cause.statusText : error.message);
  $('#publishButton').removeAttr('disabled');
  $('#publishButton2').removeAttr('disabled');
};
