export type ProgramSchedules =
  | {
      data: {
        /** 番組ID */
        nicoliveProgramId: string;
        /** テスト開始時刻 */
        testBeginAt: number;
        /** 放送開始時刻 */
        onAirBeginAt: number;
        /** 放送終了予定時刻 */
        onAirEndAt: number;
        /** 配信コミュニティ・チャンネルID */
        socialGroupId: string;
        /** 配信状態 */
        status: 'reserved' | 'test' | 'onAir' | 'end';
      }[];
      meta: {
        status: 200;
        errorCode: 'OK';
      };
    }
  | {
      meta: {
        status: number;
        errorCode: string;
      };
      data?: { message: string };
    };

export type ProgramInfo =
  | {
      meta: {
        status: 200;
        errorCode: 'OK';
      };
      data: {
        /** 番組の状態 */
        status: 'test' | 'onAir' | 'end';
        /** 番組の配信者に関係する情報 */
        socialGroup:
          | {
              providerType: 'community';
              /** コミュニティ名 */
              name: string;
              /** コミュニティID */
              id: string;
            }
          | {
              providerType: 'channel';
              /** チャンネル名 */
              name: string;
              /** チャンネルID */
              id: string;
              /** 配信会社名 */
              ownerName: string;
              /** コミュレベル */
              communityLevel: number;
            };
        /** コメントのルーム */
        rooms: {
          /** 部屋ID */
          id: number;
          /** 部屋名 */
          name: string;
          /** コメントサーバーの接続先(WebSocket) */
          webSocketUri: string;
          /** コメントサーバーの接続先(XmlSocket) */
          xmlSocketUri: string;
          /** スレッドID */
          threadId: string;
        }[];
        /** 番組タイトル */
        title: string;
        /** 番組情報 */
        description: string;
        /** メンバー限定放送であるか */
        isMemberOnly: boolean;
        /** vpos基準時刻 */
        vposBaseTime: number;
        /** 開演時間 */
        beginAt: number;
        /** 終了時間 */
        endAt: number;
        /** 番組のカテゴリ・追加カテゴリ一覧 */
        categories: string[];
        /** ニコニ広告許可設定 */
        isAdsEnabled: boolean;
        /** 配信者情報 */
        broadcaster: {
          /** 配信者/チャンネルのID */
          id: number;
          /** 配信者/配信会社名 */
          name: string;
        }[];
      };
    }
  | {
      meta: {
        status: number;
        errorCode: string;
      };
      data?: { message: string };
    };

export type Segment =
  | {
      meta: {
        status: 200;
        errorCode: 'OK';
      };
      data: {
        end_time: number;
        start_time: number;
      };
    }
  | {
      meta: {
        status: number;
        errorCode: string;
        errorMessage: string;
      };
      data?: { message: string };
    };

export type Extension =
  | {
      meta: {
        status: 200;
        errorCode: 'OK';
      };
      data: {
        end_time: number;
      };
    }
  | {
      meta: {
        status: number;
        errorCode: string;
        errorMessage: string;
      };
      data?: { message: string };
    };

export type OperatorComment =
  | {
      meta: {
        status: 200;
        errorCode: 'OK';
      };
    }
  | {
      meta: {
        status: number;
        errorCode: string;
        errorMessage: string;
      };
      data?: { message: string };
    };

export type Statistics =
  | {
      meta: {
        status: 200;
        errorCode: 'OK';
      };
      data: {
        watchCount: number;
        commentCount: number;
      };
    }
  | {
      meta: {
        status: number;
        errorCode: string;
      };
      data?: { message: string };
    };

export type NicoadStatistics =
  | {
      meta: {
        status: 200;
      };
      data: {
        totalAdPoint: number;
        totalGiftPoint: number;
        conductors: {
          text: string;
          url: string;
        }[];
      };
    }
  | {
      meta: {
        status: number;
        errorCode: string;
        errorMessage: string;
      };
    };

export type Communities =
  | {
      meta: {
        status: 200;
      };
      data: {
        communities: {
          // 使用しそうなものだけ雑に抜粋
          id: number;
          name: string;
          description: 'string';
          status: 'open' | 'closed';
          thumbnailUrl: {
            normal: string;
            small: string;
          };
          thumbnails: {
            '1024x1024': string;
            '512x512': string;
            '256x256': string;
            '128x128': string;
            '64x64': string;
          };
        }[];
        errors: {
          id: string
          meta: {
            status: number;
            errorCode: string;
            errorMessage: string;
          }
        }[];
      };
    }
  | {
      meta: {
        status: number;
        errorCode: string;
        errorMessage: string;
      };
    };
