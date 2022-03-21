import Scrollable from 'components-react/shared/Scrollable';
import React from 'react';

interface INewsItem {
  title: string;
  id: string;
  description: string;
  img: string;
  cta: string;
  target: string;
  notif: string;
}

const FAKE_NEWS_ITEMS: INewsItem[] = [];

export default function News() {
  const newsItems = FAKE_NEWS_ITEMS;

  function handleClick(target: string) {
    return () => {};
  }

  return (
    <Scrollable>
      {newsItems.map(item => (
        <div key={item.id}>
          <img src={item.img} />
          <h4>{item.title}</h4>
          <span>{item.description}</span>
          <button onClick={handleClick(item.target)}>{item.cta}</button>
        </div>
      ))}
    </Scrollable>
  );
}
