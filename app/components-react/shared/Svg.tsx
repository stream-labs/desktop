import React from 'react';

export default function Svg(p: {
  src: string;
  className?: string;
  style?: Dictionary<string | number>;
}) {
  function svgAttrs() {
    const svgMatch = p.src.match(/<svg\w?([^<]+)/);
    const svgTag = (svgMatch && svgMatch[0]) || '';
    const attrs = {};
    let attrMatch;
    console.log(p.src);
    console.log(svgMatch, svgTag);
    console.log(/(\S+)=["']?((?:.(?!["']?\s+(?:\S+)=|[>"']))+.)["']?/gm.exec(svgTag));
    while (
      (attrMatch = /(\S+)=["']?((?:.(?!["']?\s+(?:\S+)=|[>"']))+.)["']?/gm.exec(svgTag)) !== null
    ) {
      attrs[attrMatch[1]] = attrs[attrMatch[2]];
    }
    console.log('attrs');
    console.log(attrs);
    return attrs;
  }

  function derivePaths() {
    const pathsMatch = p.src.match(/[^svg](<.*>)[^svg]/m);

    return (pathsMatch && pathsMatch[1]) || '';
  }

  return (
    <svg
      {...svgAttrs()}
      className={p.className}
      style={p.style}
      dangerouslySetInnerHTML={{ __html: derivePaths() }}
    />
  );
}
