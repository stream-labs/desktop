import { IConsumerCreatedEvent, IRemoteProducer, TConnectParams } from '.';
import { Guest } from './guest';
import { MediasoupEntity } from './mediasoup-entity';

export class Consumer extends MediasoupEntity {
  transportConnected = false;
  guests: Guest[] = [];

  addGuest(sourceId: string, remoteProducer: IRemoteProducer) {
    const guest = new Guest({ remoteProducer, sourceId });
    this.guests.push(guest);
    guest.connect();
  }

  removeGuest(streamId: string) {
    const idx = this.guests.findIndex(guest => guest.streamId === streamId);

    if (idx > -1) {
      this.guests[idx].destroy();
      this.guests.splice(idx, 1);
    }
  }

  async createTransport(event: IConsumerCreatedEvent) {
    const turnConfig = await this.guestCamService.getTurnConfig();

    event.data['iceServers'] = [turnConfig];

    this.makeObsRequest('func_create_receive_transport', event.data);
  }

  /**
   * Connects this transport on the server side
   * @param connectParams Data blob the shape of which is opaque to us
   */
  async connectTransport(connectParams: TConnectParams) {
    this.sendWebRTCRequest({
      type: 'connectReceiveTransport',
      data: { ...connectParams },
    });

    this.makeObsRequest('func_connect_result', 'true');

    this.transportConnected = true;

    this.log('Connected Receive Transport');
  }

  destroy() {
    this.guests.forEach(guest => guest.destroy());

    this.makeObsRequest('func_stop_receiver');

    super.destroy();
  }
}
