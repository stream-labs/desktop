declare module 'tasklist' {
  export interface ITask {
    imageName: string;
    memUsage: number;
  }

  function tasklist(): Promise<ITask[]>;
  export default tasklist;
}
