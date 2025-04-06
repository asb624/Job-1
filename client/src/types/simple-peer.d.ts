declare module 'simple-peer' {
  import { EventEmitter } from 'events';

  interface SimplePeerOptions {
    initiator?: boolean;
    channelConfig?: object;
    channelName?: string;
    config?: RTCConfiguration;
    offerOptions?: RTCOfferOptions;
    answerOptions?: RTCAnswerOptions;
    sdpTransform?: (sdp: string) => string;
    stream?: MediaStream;
    streams?: MediaStream[];
    trickle?: boolean;
    allowHalfTrickle?: boolean;
    objectMode?: boolean;
  }

  interface SimplePeerInstance extends EventEmitter {
    signal(data: any): void;
    send(data: string | Uint8Array | ArrayBuffer | Blob): void;
    destroy(err?: Error): void;
    addStream(stream: MediaStream): void;
    removeStream(stream: MediaStream): void;
    addTrack(track: MediaStreamTrack, stream: MediaStream): void;
    removeTrack(track: MediaStreamTrack, stream: MediaStream): void;
    replaceTrack(oldTrack: MediaStreamTrack, newTrack: MediaStreamTrack, stream: MediaStream): void;
    streams?: Array<MediaStream>;
  }

  interface SimplePeerStatic {
    (opts?: SimplePeerOptions): SimplePeerInstance;
    new (opts?: SimplePeerOptions): SimplePeerInstance;
  }

  const SimplePeer: SimplePeerStatic;
  export = SimplePeer;
}