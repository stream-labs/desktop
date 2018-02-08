// customization monkeypatch

$(() => {

  var projectName = 'Streamlabs-OBS';
  if (isHomePage()) document.querySelector('h1').innerHTML = projectName;

  // patch header
  var $header = document.querySelector('h1');
  $header.innerHTML = patchHeaderText($header.innerHTML);

  // hide index
  var $index = document.querySelector('.tsd-index-group');
  if ($index) $index.style.display = 'none';

  // hide sources
  document.querySelectorAll('.tsd-sources').forEach(item => item.style.display = 'none');

  patchNavigation();
  patchBreadcrumbs();
  patchSeeTags();
  patchHierarchyBlock();
  patchImplementedByBlock();
  patchLegend();

  console.log('monkeypatch applied');

});



function patchLinkText(linkText) {

  // no need to patch if no quotes
  if (linkText.charAt(0) !== '"') return linkText;

  // remove quotes
  linkText = linkText.replace(/"/g, '');

  // remove paths
  linkText = linkText.split('/').pop();

  // transform string like "scenes-api" to "ScenesService"

  linkText = linkText.replace(/<wbr>/g, '');
  linkText = linkText.replace('-api', '');
  linkText = humps.camelize(linkText);
  linkText = linkText.charAt(0).toUpperCase() + linkText.substring(1) + 'Service';

  return linkText;
}



function getRootInterfaceName(linkText) {
  return 'I' + patchLinkText(linkText) + 'Api';
}

function getRootInterfaceHref(linkText) {
  var filename = linkText.replace(/[\/\-"]/g, '_').replace(/<wbr>/g, '');
  return (isHomePage() ? 'interfaces/' : './') +
    filename + '.' +
    getRootInterfaceName(linkText).toLowerCase() + '.html';
}

function getRootInterfaceLink(linkText) {
  return '<a href="' + getRootInterfaceHref(linkText) + '">' + getRootInterfaceName(linkText) + '</a>';
}


function patchHeaderText(headerText) {
  // replace header only for files with "-api" postfix
  if (!headerText.match('-api')) return headerText;

  if (!headerText.match('External module')) return headerText;
  const linkText = headerText.match('".+"')[0];
  return patchLinkText(linkText) + ': ' + getRootInterfaceLink(linkText, '../');
}

function patchHierarchyBlock() {
  var $hierarchy = document.querySelector('.tsd-panel.tsd-hierarchy');
  if (!$hierarchy) return;

  var hierarchySize = $hierarchy.querySelectorAll('ul').length;

  // hide hierarchy if only one element presents
  if (hierarchySize <= 1) {
    $hierarchy.style.display = 'none';
  }
}

function isServicePage() {
  return location.pathname.match(/\.i.+serviceapi\.html$/);
}

function isHomePage() {
  return location.pathname.match(/index\.html$/);
}

function patchNavigation() {

  document.querySelectorAll('.tsd-navigation.primary li a').forEach(link => {
    var linkText = link.innerHTML;

    // hide all links without "-api" postfix and some blacklisted services
    if (
      !linkText.match(/<wbr>api/) ||
      linkText.match(/obs-<wbr>api/) ||
      linkText.match(/guest-<wbr>api/) ||
      linkText.match(/server-<wbr>api/)
    ) {
      link.parentElement.style.display = 'none';
    }

    link.innerHTML = patchLinkText(linkText);
    link.href = getRootInterfaceHref(linkText);
  });
}

function patchImplementedByBlock() {
  var $implementedBy = document.querySelector('.tsd-panel.tsd-implemented-by');
  if (!$implementedBy) return;

  // show block only on service page
  if (!isServicePage()) {
    $implementedBy.style.display = 'none';
    return;
  }

  // remove links to classes
  $implementedBy.querySelector('a').removeAttribute('href');

  // add comment
  var $comment = document.createElement('div');
  $comment.classList.add('tsd-block-comment');
  $comment.innerHTML = 'Use this name as <code>resource</code> in JSONRPC request';
  $implementedBy.appendChild($comment);
}


function patchLegend() {
  // patch legend
  const whitelist = [
    'Type alias',
    'Enumeration',
    'Enumeration member',
    'Interface',
    'Interface with type parameter',
    'Property',
    'Method',
    'Index signature'
  ];

  document.querySelectorAll('.tsd-legend span').forEach(legend => {
    if (
      !whitelist.includes(legend.innerHTML) ||
      legend.parentElement.classList.contains('tsd-parent-kind-class')
    ) {
      legend.parentElement.style.display = 'none';
    }
  });

}


function patchBreadcrumbs() {
  document.querySelectorAll('.tsd-breadcrumb li a').forEach(breadcrumb => {
    breadcrumb.innerHTML = patchLinkText(breadcrumb.innerHTML);

    if (breadcrumb.href.match('globals.html')) {
      breadcrumb.href = breadcrumb.href.replace('globals', 'index');
      breadcrumb.innerHTML = 'Home';
    }
  });
}


function patchSeeTags() {
  document.querySelectorAll('.tsd-comment-tags dt').forEach($el => {
    if ($el.innerHTML !== 'see') return;
    var $tag = $el.parentElement.querySelector('p');
    var isServiceName = $tag.innerHTML.match(/[a-zA-Z]+Service$/);
    if (!isServiceName) return;
    var serviceName = $tag.innerHTML;
    var href = getLinkToService(serviceName);
    $tag.innerHTML = '<a href="' + href + '">' + serviceName + '</a>';
  });
}


function getLinkToService(serviceName) {
  var shortName = serviceName.replace('Service', '');
  var filename = '_' +
    humps.decamelize(shortName) + '_' +
    humps.decamelize(shortName + '_api') + '_.' +
    'i' + serviceName.toLowerCase() + 'api.html';
  return (isHomePage() ? 'interfaces/' : './') + filename;
}