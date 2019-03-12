const m = jest.requireActual('services/stateful-service');

export function mutation() {
  return function(x: any) {
    return x;
  };
}

export const StatefulService = m.StatefulService;
StatefulService.setupVuexStore({ watch: (x: any) => x });

export function __setup(state?: { [serviceName: string]: any }) {
  StatefulService.setupVuexStore({ watch: (x: any) => x, state });
}
