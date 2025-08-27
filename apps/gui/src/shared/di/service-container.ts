import { AgentOsAPI, AgentOsService, AgentOsServiceName } from '../../shared/types/agentos-api';

export class ServiceContainer {
  private static services = new Map<AgentOsServiceName, AgentOsService>();

  static register<K extends AgentOsServiceName>(name: K, service: AgentOsAPI[K]): void {
    this.services.set(name, service);
    console.log(`Service '${name}' registered in container`);
  }

  static getOrThrow<K extends AgentOsServiceName>(name: K): AgentOsAPI[K] {
    const service = this.services.get(name);
    if (!service) {
      throw new Error(
        `Service '${name}' not found in container. Make sure it's registered in bootstrap.`
      );
    }
    return service as AgentOsAPI[K];
  }

  static get<K extends AgentOsServiceName>(name: K): AgentOsAPI[K] | undefined {
    const api = this.services.get(name);
    if (!api) {
      return undefined;
    }
    return api as AgentOsAPI[K];
  }

  static has<K extends AgentOsServiceName>(name: K): boolean {
    return this.services.has(name);
  }

  static getRegisteredNames(): AgentOsServiceName[] {
    return Array.from(this.services.keys());
  }

  static clear(): void {
    this.services.clear();
    console.log('All services cleared from container');
  }

  static unregister<K extends AgentOsServiceName>(name: K): boolean {
    const result = this.services.delete(name);
    if (result) {
      console.log(`Service '${name}' unregistered from container`);
    }
    return result;
  }

  static getInfo() {
    return {
      registeredServices: this.getRegisteredNames(),
      totalCount: this.services.size,
    };
  }
}

