import { LoggerBindings, LoggerImplementation } from "./LoggerBindings";
import { LoggerConfiguration, LogLevel } from "./LoggerConfiguration";

const BINDINGS = new LoggerBindings().getBindings();
const BINDING = BINDINGS[0];

export type LogMethod = (message: string, ...metadata: any[]) => Promise<any>;

export interface ILoggerInstance {
    trace: LogMethod;
    debug: LogMethod;
    info: LogMethod;
    warn: LogMethod;
    error: LogMethod;
    getLogLevel(): LogLevel;
    setMetadata(...metadata: any[]): void;
}

export class DefaultLoggerInstance implements ILoggerInstance {

    private impl: LoggerImplementation;
    private name: string;
    private group: string;
    private commonMetadata: any[];
    private logLevel: LogLevel;

    public constructor(name: string, group: string, logLevel: LogLevel, impl: LoggerImplementation) {
        this.impl = impl;
        this.name = name;
        this.group = group;
        this.logLevel = logLevel;

        LoggerConfiguration.onLogLevelChanged((event) => this.logLevel = event.logLevel, group, name);
        LoggerConfiguration.onLogLevelChanged((event) => this.logLevel = event.logLevel, group);
    }

    public getLogLevel(): LogLevel {
        return this.logLevel;
    }

    public getName(): string {
        return this.name;
    }

    public getGroup(): string {
        return this.group;
    }

    public getImpl(): LoggerImplementation {
        return this.impl;
    }

    public setMetadata(...commonMetadata: any[]): void {
        this.commonMetadata = commonMetadata;
    }

    public async trace(message: string, ...metadata: any[]): Promise<any> {
        if (this.logLevel <= LogLevel.TRACE) {
            return this.impl.log(LogLevel.TRACE, message, ...metadata, ...this.commonMetadata);
        }
    }

    public async debug(message: string, ...metadata: any[]): Promise<any> {
        if (this.logLevel <= LogLevel.DEBUG) {
            return this.impl.log(LogLevel.DEBUG, message, ...metadata, ...this.commonMetadata);
        }
    }

    public async info(message: string, ...metadata: any[]): Promise<any> {
        if (this.logLevel <= LogLevel.INFO) {
            return this.impl.log(LogLevel.INFO, message, ...metadata, ...this.commonMetadata);
        }
    }

    public async warn(message: string, ...metadata: any[]): Promise<any> {
        if (this.logLevel <= LogLevel.WARN) {
            return this.impl.log(LogLevel.WARN, message, ...metadata, ...this.commonMetadata);
        }
    }

    public async error(message: string, ...metadata: any[]): Promise<any> {
        if (this.logLevel <= LogLevel.ERROR) {
            return this.impl.log(LogLevel.ERROR, message, ...metadata, ...this.commonMetadata);
        }
    }

}

export class LoggerFactory {

    public static getLogger(group = "", name = ""): ILoggerInstance {
        if (!LoggerFactory.INITIALIZED) {
            LoggerFactory.INITIALIZED = true;
            LoggerFactory.initialize();
        }

        const compoundKey = `${group}:${name}`;
        if (LoggerFactory.LOGGER_INSTANCE_CACHE.has(compoundKey)) {
            return LoggerFactory.LOGGER_INSTANCE_CACHE.get(compoundKey);
        }

        const instance = new DefaultLoggerInstance(name, group, LoggerConfiguration.getLogLevel(group, name), LoggerFactory.LOGGER);
        LoggerFactory.LOGGER_INSTANCE_CACHE.set(compoundKey, instance);
        return instance;
    }

    public static reset() {
        LoggerFactory.LOGGER_INSTANCE_CACHE.clear();
    }

    private static LOGGER: LoggerImplementation;
    private static ROOT_LOGGER: ILoggerInstance;
    private static INITIALIZED: boolean = false;
    private static LOGGER_INSTANCE_CACHE: Map<string, ILoggerInstance> = new Map();

    private static initialize() {
        if (!BINDING) {
            throw new Error("No Logger Binding found");
        }
        LoggerFactory.LOGGER = BINDING.getLoggerImplementation();
        LoggerFactory.ROOT_LOGGER = LoggerFactory.getLogger();

        if (BINDINGS.length > 1) {
            let message = "multiple bindings found:";
            BINDINGS.forEach((binding) => message += `\n  ${binding.getVendor()} - ${binding.getVersion()}`);
            message += `\n  using ${BINDING.getVendor()} - ${BINDING.getVersion()}`;
            LoggerFactory.ROOT_LOGGER.info(message);
        }
    }

}
