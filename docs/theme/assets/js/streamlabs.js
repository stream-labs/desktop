// customization monkeypatch

$(() => {

  var projectName = 'Streamlabs-OBS';
  if (isHomePage()) document.querySelector('h1').innerHTML = projectName;

  // hide index
  var $index = document.querySelector('.tsd-index-group');
  if ($index) $index.style.display = 'none';

  patchNavigation();
  removeConstructors();
  hideBreadcrumbs();
  patchHierarchyBlock();
  patchLegend();

  console.log('monkeypatch applied');
});


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

  const servicesLinks = [];
  const classesLinks = [];
  const $navigation = document.querySelector('.tsd-navigation.primary ul');

  // create navigation links
  $navigation.querySelectorAll('li a').forEach(link => {
    let linkText = link.innerHTML;

    linkText = linkText.replace(/"/g, '').replace(/<wbr>/g, '');

    // get link text
    const match = linkText.match(/([-\w]+)\/([-\w]+)/);
    if (!match) return;

    const [fullMatch, folder, item] = match;
    if (item == 'index') return; // skip index files

    const isService = folder === item;
    let newText = item.substr(0, 1).toUpperCase() + item.substring(1);
    if (isService) newText = newText + 'Service';
    newText = humps.pascalize(newText);

    // get link href
    const prefix = isHomePage() ? 'classes/' : '../classes/';
    const href = prefix + '_'+
     humps.decamelize(humps.camelize(folder)) + '_' +
     humps.decamelize(humps.camelize(item)) + '_.' +
     humps.decamelize(humps.camelize(newText)).replace(/_/g, '')  +
     '.html';

    // create new `li` element
    const li = document.createElement('li');
    li.classList.add('tsd-kind-external-module');
    if (link.parentElement.classList.contains('current')) {
      li.classList.add('current');
    }

    // create new `a` element
    const a = document.createElement('a');
    a.href = href;
    a.innerHTML = newText;
    li.appendChild(a);

    if (isService) {
      servicesLinks.push(li);
    } else {
      classesLinks.push(li);
    }
  });

  // delete old navigation links
  $navigation.innerHTML = '';

  // insert navigation links for services
  const $servicesLabel = document.createElement('li');
  $servicesLabel.classList.add('nav-header');
  $servicesLabel.innerHTML = 'Services';
  $navigation.appendChild($servicesLabel);
  servicesLinks.forEach($li => $navigation.appendChild($li));

  // insert navigation links for classes
  const $classesLabel = document.createElement('li');
  $classesLabel.classList.add('nav-header');
  $classesLabel.innerHTML = 'Classes';
  $navigation.appendChild($classesLabel);
  classesLinks.forEach($li => $navigation.appendChild($li));
}


function patchLegend() {
  // hide unrelated legend
  const whitelist = [
    'Type alias',
    'Enumeration',
    'Enumeration member',
    'Interface',
    'Interface with type parameter',
    'Property',
    'Method',
    'Index signature',
    'Class'
  ];

  document.querySelectorAll('.tsd-legend span').forEach(legend => {
    if (!whitelist.includes(legend.innerHTML)) {
      legend.parentElement.style.display = 'none';
    }
  });

}


function hideBreadcrumbs() {
  document.querySelector('.tsd-breadcrumb').remove();
}

function removeConstructors() {
  document
    .querySelectorAll('section.tsd-kind-constructor')
    .forEach(el => el.parentElement.remove());
}
