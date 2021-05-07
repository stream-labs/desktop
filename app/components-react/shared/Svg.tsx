import React from 'react';

export default function Svg(p: {
  src: string;
  className?: string;
  style?: Dictionary<string | number>;
}) {
  function svgAttrs() {
    const svgMatch = p.src.match(/^<svg ([^<]+)/);
    const svgTag = (svgMatch && svgMatch[0]) || '';
    const attrs = {};
    let attrMatch;
    while (
      (attrMatch = /(\S+)=["']?((?:.(?!["']?\s+(?:\S+)=|[>"']))+.)["']?/g.exec(svgTag)) !== null
    ) {
      attrs[attrMatch[1]] = attrs[attrMatch[2]];
    }
    console.log(attrs);
    return attrs;
  }

  function derivePaths() {
    const pathsMatch = p.src.match(/[^svg](<.*>)[^svg]/);

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
