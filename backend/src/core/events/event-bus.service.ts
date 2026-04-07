import { Injectable, Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';

@Injectable()
export class EventBusService {
  private readonly logger = new Logger(EventBusService.name);

  constructor(private readonly eventEmitter: EventEmitter2) {}

  emit<TPayload>(eventName: string, payload: TPayload): void {
    this.logger.debug(`Emitting domain event: ${eventName}`);
    this.eventEmitter.emit(eventName, payload);
  }

  async emitAsync<TPayload>(eventName: string, payload: TPayload): Promise<unknown[]> {
    this.logger.debug(`Emitting async domain event: ${eventName}`);
    return this.eventEmitter.emitAsync(eventName, payload);
  }
}
