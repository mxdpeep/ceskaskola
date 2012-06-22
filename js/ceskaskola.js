/*
 * Česká škola - custom JavaScript
 */


// @const verze
var AppVer = 80;


// zobrazí nápovědu
function showHelpDetails()
{
	if (localStorage["help"] >= AppVer) return false;

	changeStatus('<ul style="color:#000 !important;">'

	+ '<li>Refaktorizace kódu, cache optimalizace.</li>'
	+ '<li>Hledání zobrazuje rovnou článek.</li>'
	+ '<li>Druhý publikační knoflík dole pod preview :)</li>'
	+ '<li>Nové zobrazování verze v názvu stránky.</li>'
	+ '<li>Hustší jmenný rejstřík autorů.</li>'
	+ '<li>Refaktorizace a clean-up.</li>'

	+ '</ul><div style="text-align:center !important;"><button onclick="helpAccepted();this.disabled=\'disabled\';">OK :)</button></div>');

	return true;
}

// akceptování nápovědy
function helpAccepted()
{
	localStorage["help"] = AppVer;
	changeStatus();

	return true;
}

// stisk tlačítka Černá magie :)
function magic()
{
	$('#magic').attr('disabled', 'disabled');
	$('#b3').click();
	$('#b7').click();
	$('#publishButton').focus();
}

// nastavení titulku stránky
function setTitle()
{
	var a = new String(AppVer);
	document.title = 'Česká škola v' + a.split('').join('.');

	return true;
}

// časovač nápovědy
function showHelp()
{
	setTimeout('showHelpDetails();', 1500);

	return true;
}

// vytvoří listbox všech článků
function getArticles()
{
	var articles = ARTICLES.ARTICLES;
	var len = articles.length;

	var t, tit, title, artSelect, authorId, artOption, fulltitle;

	for (var i = 0; i < len; i++)
	{
		if (typeof articles[i].s_TITLE == "object")
		{
			t = 'bez názvu';
		}
		else
		{
			t = articles[i].s_TITLE;
		}
		title = new String(t);

		title = title.replace(/&nbsp;/g, ' ');
		fulltitle = title = title.replace(/  +/g, ' ');
		title = title.substring(0, 120);

		artSelect = el(BP_ID.ART_DROPDOWN);

		authorId = articles[i].pk_tbl_ARTICLES;

		artOption = document.createElement('option');

		tit = (i + 1) + " — " + findAuthor(authorId).trim() + ': ' + title;

		prepareQS((i + 1) + " " + findAuthor(authorId).trim() + ' ' + fulltitle, i);

		artOption.setAttribute('value', i);
		artOption.setAttribute('id', 'a' + i);
		artOption.appendChild(document.createTextNode(tit));
		artSelect.appendChild(artOption);
	}

	$('#body').fadeIn(1000);

	return true;
}

// nastaví poslední známou pozici listboxu
function loadListboxPosition()
{
	if (typeof localStorage["pozice"] === "undefined")
	{
		el(BP_ID.ART_DROPDOWN).value = 0;
	}
	else
	{
		el(BP_ID.ART_DROPDOWN).value = localStorage["pozice"];
	}

	return true;
}

// slovníkový objekt - budeme plnit jednotlivými tokeny
var QS = {};

// připraví slovník - prakticky rozseká na jednotlivá slova řetězce z "title"
function prepareQS(string, id)
{
	var w = string.toLowerCase().replace(/[^a-z^0-9^á^č^ď^é^ě^í^ň^ó^ř^š^ť^ú^ů^ý^ž]/g, ' ');
	w = w.split(' ');
	var len = w.length;

	for (var i = 0; i < len; i++)
	{
		w[i] = w[i].trimQS();
		if (!w[i].length) continue;

		QS[w[i]] = QS[w[i]] || [];
		QS[w[i]][QS[w[i]].length] = parseInt(id);
	}

	return true;
}

// objekt - článek
var articleContent = {};
articleContent.title = '';
articleContent.annotation = '';
articleContent.body = '';
articleContent.originalBody = '';
articleContent.footer = '';
articleContent.tags = '';
articleContent.updated = '';
articleContent.index = -1;
articleContent.listbox = -1;
articleContent.author = '';

// nahraje aktuálně zvolený článek do editoru po důkladném vyčištění
function selectArticle()
{
	articleContent.index = -1;
	articleContent.title = 'error - viz Chrome console';
	articleContent.author = '';
	articleContent.annotation = '';
	articleContent.body = '';
	articleContent.originalBody = '';
	articleContent.footer = '';
	articleContent.tags = '';

	var i = el(BP_ID.ART_DROPDOWN).value;

	// ulož pozici
	articleContent.listbox = localStorage["pozice"] = i;

	// obarví listbox
	$('#a' + i).addClass('visited');

	try
	{
		var articles = ARTICLES.ARTICLES;
		var articleIndex = articles[i].pk_tbl_ARTICLES;

		// segmenty článku
		var title = new String(articles[i].s_TITLE);
		var annotation = articles[i].s_ANNOTATION;
		var body = getArticleContent(articleIndex);
		var tags = findTag(articleIndex).trim();

		title = title.replace(/&nbsp;/g, ' ');
		title = title.replace(/  +/g, ' ');

		if (title == '[object Object]') title = 'bez názvu';

		// pro debugging uložíme i originál bez čištění
		articleContent.originalBody = body;

		// čištění anotace
		annotation = replaceEntities(annotation);
		annotation = annotation.replace(/  +/g, ' ');
		annotation = annotation.replace(/ , /g, ', ');
		annotation = annotation.replace(/\.{3,}/g, '…');

		// čištění těla - mezery
		body = body.replace(/  +/g, ' ');
		body = body.replace(/ , /g, ', ');
		body = body.replace(/\.{3,}/g, '…');

		// čištění těla - Word brajgl
		body = body.replace(/<FONT [^>]*>/g, '');
		body = body.replace(/<\/FONT>/g, '');
		body = body.replace(/<H1 [^>]*>/g, '<H1>');
		body = body.replace(/<H2 [^>]*>/g, '<H2>');
		body = body.replace(/<H3 [^>]*>/g, '<H3>');
		body = body.replace(/<H4 [^>]*>/g, '<H4>');
		body = body.replace(/<H5 [^>]*>/g, '<H5>');
		body = body.replace(/<P [^>]*>/g, '<P>');
		body = body.replace(/<UL [^>]*>/g, '<UL>');
		body = body.replace(/<OL [^>]*>/g, '<OL>');
		body = body.replace(/<LI [^>]*>/g, '<LI>');
		body = body.replace(/<STRONG [^>]*>/g, '<STRONG>');
		body = body.replace(/<EM [^>]*>/g, '<EM>');
		body = body.replace(/<DIV [^>]*>/g, '<DIV>');
		body = body.replace(/<SPAN [^>]*>/g, '<SPAN>');

		// čištění těla - pevné mezery
		body = body.replace(/(&nbsp;){2,}/g, '&nbsp;');

		// čištění těla - prázdné řádky
		body = body.replace(/<P><SPAN><o:p>&nbsp;<\/o:p><\/SPAN><\/P>/g, '\n');
		body = body.replace(/<P><BR><BR><\/P>/g, '\n');
		body = body.replace(/<P><I><BR><\/I><BR><\/P>/g, '\n');
		body = body.replace(/<P>&nbsp;<\/P>/g, '\n');

		// čištění těla - nesmyslné kotvy
		try
		{
			body = body.replace(/<A href="http:\/\/www.ceskaskola.cz\/Administration\/ElBarto[^>]*>\[([0-9]*)\]<\/A>/g, '&nbsp;[$1] ');
			body = body.replace(/<A href="http:\/\/www.ceskaskola.cz\/Ceskaskola\/AR\.asp[^>]*><SUP>([0-9]*)<\/SUP><\/A>/g, '<SUP>$1</SUP>&nbsp;');
			body = body.replace(/<A href="http:\/\/www.ceskaskola.cz\/Files\/[^>]*>([^>]*>)<\/A>/g, ' $1 ');
			body = body.replace(/<A href="http:\/\/www.ceskaskola.cz\/[^>]*>([^<]*)<\/A>/g, ' $1 ');

			// občas nám vzniknou po číštění prázdné odstavce
			body = body.replace(/<P>\s*<\/P>/g, '\n');
		}
		catch(e)
		{
			// BUM!
			console.log(e);
		}

		// HTML entity chceme zpět
		body = replaceEntities(body);

		// máme v těle textu i anotaci? pryč!
		body = body.replace(annotation, '');

		// standardní patička
		var footer = '\n<BR>\n<BR>\n<a target="autor" href="http://www.ceskaskola.cz/2001/01/o-nas.html#autor-'
			+ findAuthorId(articleIndex)
			+ '">'
			+ findAuthor(articleIndex).trim()
			+ '</a>';

		// harakiri s podmíněnou publikací
		switch (findAuthor(articleIndex).trim())
		{
			case 'press':
			case 'dokument':
				title = title.trim();
			break;

			case 'ČTK':
			case 'Zpravodajství ČTK':
				title = 'ČTK - !!! nepublikovat !!!';
				annotation = '';
				body = '';
				footer = '';
				tags = '';
			break;

			case 'INZERCE':
			case 'PR článek':
				title = title.trim();
				tags = 'PR článek';
				footer = '';
			break;

			default:
				title = findAuthor(articleIndex).trim() + ': ' + title.trim();
		}

		// začínáme obsah odkazem?
		if (body.startsWith('http'))
		{
			body = '<BR>\n' + URLizeFirst(body);
		}

		// uložení dat do objektu
		articleContent.index = articleIndex;
		articleContent.title = title;
		articleContent.author = findAuthor(articleIndex).trim();
		articleContent.annotation = annotation;
		articleContent.body = body;
		articleContent.footer = footer;
		articleContent.tags = tags;

		// podmíněné tweaky
		if (articleContent.tags == 'press') articleContent.tags = 'tisková zpráva';
		if (findAuthor(articleIndex).trim() == 'press') articleContent.tags = 'tisková zpráva';
		if (findAuthor(articleIndex).trim() == 'dokument') articleContent.tags = 'dokument';

		// časové razítko
		articleContent.updated = articles[i].d_DATE_RELEASE.trim().substring(0, 19);

		$('#' + BP_ID.PREVIEW).fadeOut(1);
	}
	catch(e)
	{
		// BUM!
		console.log(e);
		$('#' + BP_ID.PREVIEW).fadeOut(1);
	}

	// sestav editor
	composeContent();

	$('#' + BP_ID.CREATEPOST_BLOCK).fadeOut(10, function()
	{
		$('#' + BP_ID.CREATEPOST_BLOCK).fadeIn(250);
		unlockButtons();

		// hack - usnadníme si 1 kliknutí, protože pevné mezery budeme vkládat vždy
		$('#b3').attr('disabled', 'disabled');
		addNBSPContent();
	});

	return true;
}

// zamkne tlačítka
function lockButtons()
{
	$('#b1').attr('disabled', 'disabled');
	$('#b2').attr('disabled', 'disabled');
	$('#b3').attr('disabled', 'disabled');
	$('#b4').attr('disabled', 'disabled');
	$('#b5').attr('disabled', 'disabled');
	$('#b6').attr('disabled', 'disabled');
	$('#b7').attr('disabled', 'disabled');

	$('#magic').attr('disabled', 'disabled');
}

// odemkne tlačítka
function unlockButtons()
{
	$('#b1').removeAttr('disabled');
	$('#b2').removeAttr('disabled');
	$('#b3').removeAttr('disabled');
	$('#b4').removeAttr('disabled');
	$('#b5').removeAttr('disabled');
	$('#b6').removeAttr('disabled');
	$('#b7').removeAttr('disabled');

	$('#btRand').removeAttr('disabled');
	$('#btPrev').removeAttr('disabled');
	$('#btNext').removeAttr('disabled');
	$('#magic').removeAttr('disabled');

	$('#preview').removeAttr('contenteditable');
	$('#preview').attr('title', 'kliknutím zahájíte WYSIWYG editaci');

	setTimeout("$('#skip').removeAttr('disabled');", 2000);
	setTimeout("$('#publishButton').removeAttr('disabled');", 2000);
	setTimeout("$('#publishButton2').removeAttr('disabled');", 2000);
}

// sestaví obsah editoru z objektu článku
function composeContent()
{
	el(BP_ID.FORM_TITLE).value = articleContent.title;
	el(BP_ID.FORM_CONTENT).value = articleContent.annotation
		+ '\n<!--more-->\n'
		+ articleContent.body
		+ articleContent.footer;

	el(BP_ID.FORM_UPDATED).value = articleContent.updated;
	el(BP_ID.FORM_TAGS).value = articleContent.tags;

	updatePreview();
}

// globální parametrická cache - většinu věcí chceme hledat jen jednou
var CACHE = {};
CACHE.tagId = {};
CACHE.tagName = {};
CACHE.authorId = {};
CACHE.authorName = {};

// najde ID kategorie = tagu článku
function findTag(lookup)
{
	var kategorie = CATEGORIES_GROUP.CATEGORIES_GROUP;
	var len = kategorie.length;

	var kat;
	var result = '';

	// cache
	if (typeof CACHE.tagId[lookup] !== "undefined")
	{
		return findTagText(CACHE.tagId[lookup]);
	}

	for (var i = 0; i < len; i++)
	{
		if (kategorie[i].fk_tbl_ARTICLES == lookup)
		{
			CACHE.tagId[lookup] = kat = kategorie[i].fk_tbl_CATEGORIES;
			result = findTagText(kat);
			break;
		}
	}

	return result;
}

// najde název kategorie = tagu článku
function findTagText(lookup)
{
	var kategorie = CATEGORIES.CATEGORIES;
	var len = kategorie.length;

	var result = '';

	// cache
	if (typeof CACHE.tagName[lookup] !== "undefined")
	{
		return CACHE.tagName[lookup];
	}

	for (var i = 0; i < len; i++)
	{
		if (kategorie[i].pk_tbl_CATEGORIES == lookup)
		{
			CACHE.tagName[lookup] = result = kategorie[i].s_NAME_FOR_SEARCH;
			break;
		}
	}

	return result;
}

// najde obsah článku (necachujeme)
function getArticleContent(lookup)
{
	var clanky = CHAPTERS.CHAPTERS;
	var len = clanky.length;

	var result = '';

	for (var i = 0; i < len; i++)
	{
		if (clanky[i].fk_tbl_ARTICLES == lookup)
		{
			result = clanky[i].t_BODY;
			break;
		}
	}

	return result;
}

// vrátí ID autora
function findAuthorId(lookup)
{
	var autori = AUTHORS_GROUP.AUTHORS_GROUP;
	var len = autori.length;

	var result = 0;

	// cache
	if (typeof CACHE.authorId[lookup] !== "undefined")
	{
		return CACHE.authorId[lookup];
	}

	for (var i = 0; i < len; i++)
	{
		if (autori[i].fk_tbl_ARTICLES == lookup)
		{
			CACHE.authorId[lookup] = result = autori[i].fk_tbl_AUTHORS;
			break;
		}
	}

	return result;
}

// vrátí jméno autora
function findAuthor(lookup)
{
	var autori = AUTHORS_GROUP.AUTHORS_GROUP;
	var len = autori.length;

	var result = 'anonym';

	// cache
	if (typeof CACHE.authorName[lookup] !== "undefined")
	{
		return CACHE.authorName[lookup];
	}

	CACHE.authorName[lookup] = result = findAuthorName(findAuthorId(lookup));

	return result;
}

// vrátí jméno autora
function findAuthorNormal(lookup)
{
	var autori = AUTHORS_GROUP.AUTHORS_GROUP;
	var len = autori.length;

	var result = 'anonym';

	for (var i = 0; i < len; i++)
	{
		if (autori[i].fk_tbl_ARTICLES == lookup)
		{
			autor = autori[i].fk_tbl_AUTHORS;
			result = findAuthorNameNormal(autor);
			break;
		}
	}

	return result;
}

// vrátí jméno autora ve tvaru PŘÍJMENÍ JMÉNO
function findAuthorName(lookup)
{
	var jmena = AUTHORS.AUTHORS;
	var len = jmena.length;

	var result = 'anonym';

	for (var i = 0; i < len; i++)
	{
		if (jmena[i].pk_tbl_AUTHORS == lookup)
		{
			result = jmena[i].s_REAL_NAME_REVERS;
			result = result.replace(/[\-–_:;,\/.]/g, '');
			break;
		}
	}
	return result;
}

// vrátí jméno autora ve tvaru JMÉNO PŘÍJMENÍ
function findAuthorNameNormal(lookup)
{
	var jmena = AUTHORS.AUTHORS;
	var len = jmena.length;

	var result = 'anonym';

	for (var i = 0; i < len; i++)
	{
		if (jmena[i].pk_tbl_AUTHORS == lookup)
		{
			result = jmena[i].s_REAL_NAME;
			result = result.replace(/[\-–_:;,\/.]/g, '');
			break;
		}
	}
	return result;
}

// aktualizuje preview
function updatePreview()
{
	var x = el(BP_ID.FORM_CONTENT).value;

	document.getElementById('preview').innerHTML = x.replace('<!--more-->', '<hr noshade>');

	if (x.length == 0)
	{
		$('#' + BP_ID.PREVIEW).fadeOut(100);
		$('#publishButton2').fadeOut(100);
	}
	else
	{
		$('#' + BP_ID.PREVIEW).fadeIn(100);
		$('#publishButton2').fadeIn(100);
	}
}

// aktualizuje editor
function acceptPreview()
{
	lockButtons();
	el(BP_ID.FORM_CONTENT).value = $('#preview').html().replace('<hr noshade="">', '<!--more-->');
}

// aktualizuje listbox podle vyhledávání
function quickSearch(search)
{
	if (!search.length) return false;

	search = search.toLowerCase().replace(/[^a-z^0-9^á^č^ď^é^ě^í^ň^ó^ř^š^ť^ú^ů^ý^ž]/g, ' ');
	if (!search.length) return false;

	search = search.split(' ');

	for (var j = 0; j < search.length; j++)
	{
		if (!search[j].trimQS().length) continue;

		if (findPosition(search[j].trimQS()))
		{
			selectArticle();
			return true;
		}
	}

	function findPosition(value)
	{
		var arr = QS[value];
		if (typeof arr === 'undefined') return false;

		var len = arr.length;
		var z = parseInt(el(BP_ID.ART_DROPDOWN).value);

		for (var i = 0; i < len; i++)
		{
			if (arr[i] > z)
			{
				// najdi další pozici za aktuální
				el(BP_ID.ART_DROPDOWN).value = arr[i];
				return true;
			}
		}

		// nastav první pozici
		el(BP_ID.ART_DROPDOWN).value = arr[0];
		return true;
	}

	return false;
}

// publikuj článek
function publish()
{
	$('#publishButton').attr('disabled','disabled');
	$('#publishButton2').attr('disabled','disabled');
	$('#' + BP_ID.PREVIEW).fadeOut(500);
	$('body').animate({scrollTop: $('#controls').offset().top}, 500);
	insertOrUpdatePostEntry();

	return true;
}

// vytvoří jmenný rejstřík
function authorIndex()
{
	var content = [];

	var jmena = AUTHORS.AUTHORS;
	var len = jmena.length;

	for (var i = 0; i < len; i++)
	{
		if (jmena[i].pk_tbl_AUTHORS)
		{
			if (typeof jmena[i].t_DESCRIPTION == "object")
			{
				jmena[i].t_DESCRIPTION = '';
			}

			content[i] = '<P><a name="autor-'
			+ jmena[i].pk_tbl_AUTHORS + '"></a><STRONG>'
			+ jmena[i].s_REAL_NAME_REVERS.replace(/[\-–_:;,\/.]/g, '').trim()
			+ '</STRONG>\n'
			+ '<a href="mailto:"'
			+ jmena[i].s_EMAIL.trim()
			+ '">'
			+ jmena[i].s_EMAIL.trim()
			+ '</a>\n'
			+ '\n' + addNBSP(jmena[i].t_DESCRIPTION.trim())
			+ '</P>';
		}
	}

	el(BP_ID.FORM_CONTENT).value = content.join('\n');
	lockButtons();
	updatePreview();

	return true;
}

/******************************************************************************/
/******************************************************************************/
/******************************************************************************/
/******************************************************************************/
/******************************************************************************/

// odstraní IMG z obsahu článku
function removeIMGContent()
{
	articleContent.annotation = deIMG(articleContent.annotation);
	articleContent.body = deIMG(articleContent.body);
	composeContent();
}

// odstraní HTML z obsahu článku
function removeHTMLContent()
{
	articleContent.annotation = deHTML(articleContent.annotation);
	articleContent.body = deHTML(articleContent.body);
	composeContent();
}

// odstraní &nbsp; z obsahu článku
function removeNBSPContent()
{
	articleContent.annotation = deNBSP(articleContent.annotation);
	articleContent.body = deNBSP(articleContent.body);
	composeContent();
}

// přidá pevné mezery pro sazbu
function addNBSPContent()
{
	articleContent.annotation = addNBSP(articleContent.annotation);
	articleContent.body = addNBSP(articleContent.body);
	composeContent();
}

// odstraní <BR> z obsaju článku
function removeBRContent()
{
	articleContent.annotation = deBR(articleContent.annotation);
	articleContent.body = deBR(articleContent.body);
	composeContent();
}

// doplní do obsahu článku BR
function addBRContent()
{
	articleContent.annotation = addBR(articleContent.annotation);
	articleContent.body = addBR(articleContent.body);
	composeContent();
}

// převede odkazy na HTML
function addAnchorsContent()
{
	articleContent.annotation = URLizeAll(articleContent.annotation);
	articleContent.body = URLizeAll(articleContent.body);
	composeContent();
}

/******************************************************************************/
/******************************************************************************/
/******************************************************************************/
/******************************************************************************/
/******************************************************************************/

// odstraní IMG z obsahu článku
function removeIMGEditor()
{
	el(BP_ID.FORM_CONTENT).value = deIMG(el(BP_ID.FORM_CONTENT).value);
	updatePreview();
}

// odstraní HTML z obsahu článku
function removeHTMLEditor()
{
	el(BP_ID.FORM_CONTENT).value = deHTML(el(BP_ID.FORM_CONTENT).value);
	updatePreview();
}

// odstraní &nbsp; z obsahu článku
function removeNBSPEditor()
{
	el(BP_ID.FORM_CONTENT).value = deNBSP(el(BP_ID.FORM_CONTENT).value);
	updatePreview();
}

// přidá pevné mezery pro sazbu
function addNBSPEditor()
{
	el(BP_ID.FORM_CONTENT).value = addNBSP(el(BP_ID.FORM_CONTENT).value);
	updatePreview();
}

// odstraní <BR> z obsaju článku
function removeBREditor()
{
	el(BP_ID.FORM_CONTENT).value = deBR(el(BP_ID.FORM_CONTENT).value);
	updatePreview();
}

// doplní do obsahu článku BR
function addBREditor()
{
	el(BP_ID.FORM_CONTENT).value = addBR(el(BP_ID.FORM_CONTENT).value);
	updatePreview();
}

// převede odkazy na HTML
function addAnchorsEditor()
{
	el(BP_ID.FORM_CONTENT).value = URLizeAll(el(BP_ID.FORM_CONTENT).value);
	articleContent.body = URLizeAll(articleContent.body);
	updatePreview();
}


/******************************************************************************/
/******************************************************************************/
/******************************************************************************/
/******************************************************************************/
/******************************************************************************/

// odstraní z řetězce obrázky (a případné prázdné odstavce po smazání obrázku z něj)
function deIMG(string)
{
	string = string.replace(/<IMG [^>]*>/ig, '');
	string = string.replace(/<P>\s*<\/P>/ig, '\n');
	return string;
}

// odstraní z řetězce HTML
function deHTML(string)
{
	var div = document.createElement('div');
	div.innerHTML = string;
	return div.textContent || div.innerText || '';
}

// odstraní z řetězce &nbsp;
function deNBSP(string)
{
	return string.replace(/&nbsp;/g, ' ');
}

// odstraní z řetězce <BR> nebo <br>
function deBR(string)
{
	return string.replace(/<BR>/ig, '\n');
}

// doplní do řetězce <BR>
function addBR(string)
{
	return string.replace(/\n\n/g, '\n<BR>');
}

// doplní pevné mezery
function addNBSP(string)
{
	string = string.replace(/ ([aikosuvzAIKOSUVZ]) /g, ' $1&nbsp;');
	string = string.replace(/ ([0-9]*)%/g, ' $1&nbsp;%');
	string = string.replace(/ ([0-9]*) /g, ' $1&nbsp;');
	return string;
}

// převede české entity
function replaceEntities(string)
{
	string = string.replace(/&Aacute;/g, 'Á');
	string = string.replace(/&aacute;/g, 'á');
	string = string.replace(/&#268;/g, 'Č');
	string = string.replace(/&#269;/g, 'č');
	string = string.replace(/&#270;/g, 'Ď');
	string = string.replace(/&#271;/g, 'ď');
	string = string.replace(/&Eacute;/g, 'É');
	string = string.replace(/&eacute;/g, 'é');
	string = string.replace(/&#282;/g, 'Ě');
	string = string.replace(/&#283;/g, 'ě');
	string = string.replace(/&Iacute;/g, 'Í');
	string = string.replace(/&iacute;/g, 'í');
	string = string.replace(/&#327;/g, 'Ň');
	string = string.replace(/&#328;/g, 'ň');
	string = string.replace(/&Oacute;/g, 'Ó');
	string = string.replace(/&oacute;/g, 'ó');
	string = string.replace(/&#344;/g, 'Ř');
	string = string.replace(/&#345;/g, 'ř');
	string = string.replace(/&#352;/g, 'Š');
	string = string.replace(/&#353;/g, 'š');
	string = string.replace(/&#356;/g, 'Ť');
	string = string.replace(/&#357;/g, 'ť');
	string = string.replace(/&Uacute;/g, 'Ú');
	string = string.replace(/&uacute;/g, 'ú');
	string = string.replace(/&#366;/g, 'Ů');
	string = string.replace(/&#367;/g, 'ů');
	string = string.replace(/&Yacute;/g, 'Ý');
	string = string.replace(/&yacute;/g, 'ý');
	string = string.replace(/&#381;/g, 'Ž');
	string = string.replace(/&#382;/g, 'ž');
	string = string.replace(/&scaron;/g, 'š');
	string = string.replace(/&Scaron;/g, 'Š');
	return string;
}

// URLize (pouze první)
function URLizeFirst(string)
{
	var reg = /(\b(https?|ftp):\/\/[-A-Z0-9+&@#\/%?=~_|!:,.;]*[-A-Z0-9+&@#\/%=~_|])/i;
    string = string.replace(reg, '<a href="$1" target="_blank">$1</a>');
	return string;
}

// URLize
function URLizeAll(string)
{
	var reg = /(\b(https?|ftp):\/\/[-A-Z0-9+&@#\/%?=~_|!:,.;]*[-A-Z0-9+&@#\/%=~_|])/ig;
    string = string.replace(reg, '<a href="$1" target="_blank">$1</a>');
	return string;
}

/******************************************************************************/
/******************************************************************************/
/******************************************************************************/
/******************************************************************************/
/******************************************************************************/

String.prototype.trim = function()
{
	return this.replace(/^\s\s*/, '').replace(/\s\s*$/, '');
}

String.prototype.ltrim = function()
{
	return this.replace(/^\s+/, '');
}

String.prototype.rtrim = function()
{
	return this.replace(/\s+$/, '');
}

String.prototype.fullTrim = function()
{
	return this.replace(/(?:(?:^|\n)\s+|\s+(?:$|\n))/g, '').replace(/\s+/g, ' ');
}

String.prototype.startsWith = function (string)
{
	return this.indexOf(string) == 0;
}

String.prototype.trimQS = function()
{
	return this.replace(/[^a-z^0-9^á^č^ď^é^ě^í^ň^ó^ř^š^ť^ú^ů^ý^ž]/g, '').replace(/^\s\s*/, '').replace(/\s\s*$/, '');
}
