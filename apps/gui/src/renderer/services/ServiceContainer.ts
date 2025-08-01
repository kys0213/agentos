/**
 * 간단한 의존성 주입 컨테이너
 * 서비스 인스턴스들을 등록하고 조회할 수 있는 기능 제공
 */
export class ServiceContainer {
  private static services = new Map<string, any>();

  /**
   * 서비스를 컨테이너에 등록
   */
  static register<T>(name: string, service: T): void {
    this.services.set(name, service);
    console.log(`Service '${name}' registered in container`);
  }

  /**
   * 등록된 서비스를 이름으로 조회
   */
  static get<T>(name: string): T {
    const service = this.services.get(name);
    if (!service) {
      throw new Error(
        `Service '${name}' not found in container. Make sure it's registered in bootstrap.`
      );
    }
    return service;
  }

  /**
   * 서비스가 등록되어 있는지 확인
   */
  static has(name: string): boolean {
    return this.services.has(name);
  }

  /**
   * 등록된 모든 서비스 이름 목록 반환
   */
  static getRegisteredNames(): string[] {
    return Array.from(this.services.keys());
  }

  /**
   * 모든 서비스 등록 해제 (주로 테스트용)
   */
  static clear(): void {
    this.services.clear();
    console.log('All services cleared from container');
  }

  /**
   * 특정 서비스 등록 해제
   */
  static unregister(name: string): boolean {
    const result = this.services.delete(name);
    if (result) {
      console.log(`Service '${name}' unregistered from container`);
    }
    return result;
  }

  /**
   * 컨테이너 상태 정보 반환 (디버깅용)
   */
  static getInfo() {
    return {
      registeredServices: this.getRegisteredNames(),
      totalCount: this.services.size,
    };
  }
}
