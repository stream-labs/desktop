export type TTwitchStreamResponse = {
  data: [
    {
      id: number;
      user_id: number;
      user_login: string;
      user_name: string;
      game_id: number;
      game_name: string;
      type: string;
      title: string;
      viewer_count: number;
      started_at: string;
      language: string;
      thumbnail_url: string;
      tag_ids: string[];
      tags: string[];
      is_mature: boolean;
    },
  ];
  pagination: {
    cursor: string;
  };
};
