// customization monkeypatch


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

function getRootInterfaceHref(linkText, prefix = '') {
  var filename = linkText.replace(/[\/\-"]/g, '_').replace(/<wbr>/g, '');
  return prefix + 'interfaces/' + filename + '.' + getRootInterfaceName(linkText).toLowerCase() + '.html';
}

function getRootInterfaceLink(linkText, prefix) {
  return '<a href="' + getRootInterfaceHref(linkText, prefix) + '">' + getRootInterfaceName(linkText) + '</a>';
}


function patchHeaderText(headerText) {
  // replace header only for files with "-api" postfix
  if (!headerText.match('-api')) return headerText;

  if (!headerText.match('External module')) return headerText;
  const linkText = headerText.match('".+"')[0];
  return patchLinkText(linkText) + ': ' + getRootInterfaceLink(linkText, '../');
}


$(() => {
  console.log('monkeypatch applied');

  var projectName = 'Streamlabs-OBS';

  // hide toolbar and search-bar
  // document.querySelector('.tsd-page-toolbar .container').innerHTML = '<div class="title">' + projectName + '</div>';

  // patch header
  var $header = document.querySelector('h1');
  $header.innerHTML = patchHeaderText($header.innerHTML);

  // patch navigation
  document.querySelectorAll('.tsd-navigation.primary li a').forEach(link => {
    var linkText = link.innerHTML;

    // hide all links without "-api" postfix
    if (!linkText.match(/<wbr>api/) || linkText.match(/obs-<wbr>api/)) {
      link.parentElement.style.display = 'none';
    }

    link.innerHTML = patchLinkText(linkText);
  });

  // patch breadcrumbs
  document.querySelectorAll('.tsd-breadcrumb li a').forEach(breadcrumb => {
    breadcrumb.innerHTML = patchLinkText(breadcrumb.innerHTML);

    if (breadcrumb.href.match('globals.html')) {
      breadcrumb.href = breadcrumb.href.replace('globals', 'index');
      breadcrumb.innerHTML = 'Home';
    }
  });

  // hide sources
  document.querySelectorAll('.tsd-sources').forEach(item => item.style.display = 'none');

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

});
