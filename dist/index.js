import * as core from '@actions/core';
import * as fs from 'fs';
import * as require$$0 from 'os';
import require$$0__default from 'os';
import * as path from 'path';
import * as os from 'node:os';
import { EOL } from 'node:os';
import util$2, { inspect } from 'node:util';
import * as process$1 from 'node:process';
import { randomUUID as randomUUID$1 } from 'node:crypto';
import { Readable } from 'stream';
import require$$0$2 from 'net';
import require$$1$3 from 'tls';
import require$$2 from 'assert';
import require$$1 from 'tty';
import require$$1$1 from 'util';
import require$$0$1 from 'http';
import require$$1$2 from 'https';
import require$$5 from 'url';
import require$$3 from 'events';
import * as http from 'node:http';
import * as https from 'node:https';
import * as zlib from 'node:zlib';
import { Transform } from 'node:stream';

var util$1;
(function (util) {
    util.assertEqual = (_) => { };
    function assertIs(_arg) { }
    util.assertIs = assertIs;
    function assertNever(_x) {
        throw new Error();
    }
    util.assertNever = assertNever;
    util.arrayToEnum = (items) => {
        const obj = {};
        for (const item of items) {
            obj[item] = item;
        }
        return obj;
    };
    util.getValidEnumValues = (obj) => {
        const validKeys = util.objectKeys(obj).filter((k) => typeof obj[obj[k]] !== "number");
        const filtered = {};
        for (const k of validKeys) {
            filtered[k] = obj[k];
        }
        return util.objectValues(filtered);
    };
    util.objectValues = (obj) => {
        return util.objectKeys(obj).map(function (e) {
            return obj[e];
        });
    };
    util.objectKeys = typeof Object.keys === "function" // eslint-disable-line ban/ban
        ? (obj) => Object.keys(obj) // eslint-disable-line ban/ban
        : (object) => {
            const keys = [];
            for (const key in object) {
                if (Object.prototype.hasOwnProperty.call(object, key)) {
                    keys.push(key);
                }
            }
            return keys;
        };
    util.find = (arr, checker) => {
        for (const item of arr) {
            if (checker(item))
                return item;
        }
        return undefined;
    };
    util.isInteger = typeof Number.isInteger === "function"
        ? (val) => Number.isInteger(val) // eslint-disable-line ban/ban
        : (val) => typeof val === "number" && Number.isFinite(val) && Math.floor(val) === val;
    function joinValues(array, separator = " | ") {
        return array.map((val) => (typeof val === "string" ? `'${val}'` : val)).join(separator);
    }
    util.joinValues = joinValues;
    util.jsonStringifyReplacer = (_, value) => {
        if (typeof value === "bigint") {
            return value.toString();
        }
        return value;
    };
})(util$1 || (util$1 = {}));
var objectUtil;
(function (objectUtil) {
    objectUtil.mergeShapes = (first, second) => {
        return {
            ...first,
            ...second, // second overwrites first
        };
    };
})(objectUtil || (objectUtil = {}));
const ZodParsedType = util$1.arrayToEnum([
    "string",
    "nan",
    "number",
    "integer",
    "float",
    "boolean",
    "date",
    "bigint",
    "symbol",
    "function",
    "undefined",
    "null",
    "array",
    "object",
    "unknown",
    "promise",
    "void",
    "never",
    "map",
    "set",
]);
const getParsedType = (data) => {
    const t = typeof data;
    switch (t) {
        case "undefined":
            return ZodParsedType.undefined;
        case "string":
            return ZodParsedType.string;
        case "number":
            return Number.isNaN(data) ? ZodParsedType.nan : ZodParsedType.number;
        case "boolean":
            return ZodParsedType.boolean;
        case "function":
            return ZodParsedType.function;
        case "bigint":
            return ZodParsedType.bigint;
        case "symbol":
            return ZodParsedType.symbol;
        case "object":
            if (Array.isArray(data)) {
                return ZodParsedType.array;
            }
            if (data === null) {
                return ZodParsedType.null;
            }
            if (data.then && typeof data.then === "function" && data.catch && typeof data.catch === "function") {
                return ZodParsedType.promise;
            }
            if (typeof Map !== "undefined" && data instanceof Map) {
                return ZodParsedType.map;
            }
            if (typeof Set !== "undefined" && data instanceof Set) {
                return ZodParsedType.set;
            }
            if (typeof Date !== "undefined" && data instanceof Date) {
                return ZodParsedType.date;
            }
            return ZodParsedType.object;
        default:
            return ZodParsedType.unknown;
    }
};

const ZodIssueCode = util$1.arrayToEnum([
    "invalid_type",
    "invalid_literal",
    "custom",
    "invalid_union",
    "invalid_union_discriminator",
    "invalid_enum_value",
    "unrecognized_keys",
    "invalid_arguments",
    "invalid_return_type",
    "invalid_date",
    "invalid_string",
    "too_small",
    "too_big",
    "invalid_intersection_types",
    "not_multiple_of",
    "not_finite",
]);
class ZodError extends Error {
    get errors() {
        return this.issues;
    }
    constructor(issues) {
        super();
        this.issues = [];
        this.addIssue = (sub) => {
            this.issues = [...this.issues, sub];
        };
        this.addIssues = (subs = []) => {
            this.issues = [...this.issues, ...subs];
        };
        const actualProto = new.target.prototype;
        if (Object.setPrototypeOf) {
            // eslint-disable-next-line ban/ban
            Object.setPrototypeOf(this, actualProto);
        }
        else {
            this.__proto__ = actualProto;
        }
        this.name = "ZodError";
        this.issues = issues;
    }
    format(_mapper) {
        const mapper = _mapper ||
            function (issue) {
                return issue.message;
            };
        const fieldErrors = { _errors: [] };
        const processError = (error) => {
            for (const issue of error.issues) {
                if (issue.code === "invalid_union") {
                    issue.unionErrors.map(processError);
                }
                else if (issue.code === "invalid_return_type") {
                    processError(issue.returnTypeError);
                }
                else if (issue.code === "invalid_arguments") {
                    processError(issue.argumentsError);
                }
                else if (issue.path.length === 0) {
                    fieldErrors._errors.push(mapper(issue));
                }
                else {
                    let curr = fieldErrors;
                    let i = 0;
                    while (i < issue.path.length) {
                        const el = issue.path[i];
                        const terminal = i === issue.path.length - 1;
                        if (!terminal) {
                            curr[el] = curr[el] || { _errors: [] };
                            // if (typeof el === "string") {
                            //   curr[el] = curr[el] || { _errors: [] };
                            // } else if (typeof el === "number") {
                            //   const errorArray: any = [];
                            //   errorArray._errors = [];
                            //   curr[el] = curr[el] || errorArray;
                            // }
                        }
                        else {
                            curr[el] = curr[el] || { _errors: [] };
                            curr[el]._errors.push(mapper(issue));
                        }
                        curr = curr[el];
                        i++;
                    }
                }
            }
        };
        processError(this);
        return fieldErrors;
    }
    static assert(value) {
        if (!(value instanceof ZodError)) {
            throw new Error(`Not a ZodError: ${value}`);
        }
    }
    toString() {
        return this.message;
    }
    get message() {
        return JSON.stringify(this.issues, util$1.jsonStringifyReplacer, 2);
    }
    get isEmpty() {
        return this.issues.length === 0;
    }
    flatten(mapper = (issue) => issue.message) {
        const fieldErrors = {};
        const formErrors = [];
        for (const sub of this.issues) {
            if (sub.path.length > 0) {
                const firstEl = sub.path[0];
                fieldErrors[firstEl] = fieldErrors[firstEl] || [];
                fieldErrors[firstEl].push(mapper(sub));
            }
            else {
                formErrors.push(mapper(sub));
            }
        }
        return { formErrors, fieldErrors };
    }
    get formErrors() {
        return this.flatten();
    }
}
ZodError.create = (issues) => {
    const error = new ZodError(issues);
    return error;
};

const errorMap = (issue, _ctx) => {
    let message;
    switch (issue.code) {
        case ZodIssueCode.invalid_type:
            if (issue.received === ZodParsedType.undefined) {
                message = "Required";
            }
            else {
                message = `Expected ${issue.expected}, received ${issue.received}`;
            }
            break;
        case ZodIssueCode.invalid_literal:
            message = `Invalid literal value, expected ${JSON.stringify(issue.expected, util$1.jsonStringifyReplacer)}`;
            break;
        case ZodIssueCode.unrecognized_keys:
            message = `Unrecognized key(s) in object: ${util$1.joinValues(issue.keys, ", ")}`;
            break;
        case ZodIssueCode.invalid_union:
            message = `Invalid input`;
            break;
        case ZodIssueCode.invalid_union_discriminator:
            message = `Invalid discriminator value. Expected ${util$1.joinValues(issue.options)}`;
            break;
        case ZodIssueCode.invalid_enum_value:
            message = `Invalid enum value. Expected ${util$1.joinValues(issue.options)}, received '${issue.received}'`;
            break;
        case ZodIssueCode.invalid_arguments:
            message = `Invalid function arguments`;
            break;
        case ZodIssueCode.invalid_return_type:
            message = `Invalid function return type`;
            break;
        case ZodIssueCode.invalid_date:
            message = `Invalid date`;
            break;
        case ZodIssueCode.invalid_string:
            if (typeof issue.validation === "object") {
                if ("includes" in issue.validation) {
                    message = `Invalid input: must include "${issue.validation.includes}"`;
                    if (typeof issue.validation.position === "number") {
                        message = `${message} at one or more positions greater than or equal to ${issue.validation.position}`;
                    }
                }
                else if ("startsWith" in issue.validation) {
                    message = `Invalid input: must start with "${issue.validation.startsWith}"`;
                }
                else if ("endsWith" in issue.validation) {
                    message = `Invalid input: must end with "${issue.validation.endsWith}"`;
                }
                else {
                    util$1.assertNever(issue.validation);
                }
            }
            else if (issue.validation !== "regex") {
                message = `Invalid ${issue.validation}`;
            }
            else {
                message = "Invalid";
            }
            break;
        case ZodIssueCode.too_small:
            if (issue.type === "array")
                message = `Array must contain ${issue.exact ? "exactly" : issue.inclusive ? `at least` : `more than`} ${issue.minimum} element(s)`;
            else if (issue.type === "string")
                message = `String must contain ${issue.exact ? "exactly" : issue.inclusive ? `at least` : `over`} ${issue.minimum} character(s)`;
            else if (issue.type === "number")
                message = `Number must be ${issue.exact ? `exactly equal to ` : issue.inclusive ? `greater than or equal to ` : `greater than `}${issue.minimum}`;
            else if (issue.type === "bigint")
                message = `Number must be ${issue.exact ? `exactly equal to ` : issue.inclusive ? `greater than or equal to ` : `greater than `}${issue.minimum}`;
            else if (issue.type === "date")
                message = `Date must be ${issue.exact ? `exactly equal to ` : issue.inclusive ? `greater than or equal to ` : `greater than `}${new Date(Number(issue.minimum))}`;
            else
                message = "Invalid input";
            break;
        case ZodIssueCode.too_big:
            if (issue.type === "array")
                message = `Array must contain ${issue.exact ? `exactly` : issue.inclusive ? `at most` : `less than`} ${issue.maximum} element(s)`;
            else if (issue.type === "string")
                message = `String must contain ${issue.exact ? `exactly` : issue.inclusive ? `at most` : `under`} ${issue.maximum} character(s)`;
            else if (issue.type === "number")
                message = `Number must be ${issue.exact ? `exactly` : issue.inclusive ? `less than or equal to` : `less than`} ${issue.maximum}`;
            else if (issue.type === "bigint")
                message = `BigInt must be ${issue.exact ? `exactly` : issue.inclusive ? `less than or equal to` : `less than`} ${issue.maximum}`;
            else if (issue.type === "date")
                message = `Date must be ${issue.exact ? `exactly` : issue.inclusive ? `smaller than or equal to` : `smaller than`} ${new Date(Number(issue.maximum))}`;
            else
                message = "Invalid input";
            break;
        case ZodIssueCode.custom:
            message = `Invalid input`;
            break;
        case ZodIssueCode.invalid_intersection_types:
            message = `Intersection results could not be merged`;
            break;
        case ZodIssueCode.not_multiple_of:
            message = `Number must be a multiple of ${issue.multipleOf}`;
            break;
        case ZodIssueCode.not_finite:
            message = "Number must be finite";
            break;
        default:
            message = _ctx.defaultError;
            util$1.assertNever(issue);
    }
    return { message };
};

let overrideErrorMap = errorMap;
function getErrorMap() {
    return overrideErrorMap;
}

const makeIssue = (params) => {
    const { data, path, errorMaps, issueData } = params;
    const fullPath = [...path, ...(issueData.path || [])];
    const fullIssue = {
        ...issueData,
        path: fullPath,
    };
    if (issueData.message !== undefined) {
        return {
            ...issueData,
            path: fullPath,
            message: issueData.message,
        };
    }
    let errorMessage = "";
    const maps = errorMaps
        .filter((m) => !!m)
        .slice()
        .reverse();
    for (const map of maps) {
        errorMessage = map(fullIssue, { data, defaultError: errorMessage }).message;
    }
    return {
        ...issueData,
        path: fullPath,
        message: errorMessage,
    };
};
function addIssueToContext(ctx, issueData) {
    const overrideMap = getErrorMap();
    const issue = makeIssue({
        issueData: issueData,
        data: ctx.data,
        path: ctx.path,
        errorMaps: [
            ctx.common.contextualErrorMap, // contextual error map is first priority
            ctx.schemaErrorMap, // then schema-bound map if available
            overrideMap, // then global override map
            overrideMap === errorMap ? undefined : errorMap, // then global default map
        ].filter((x) => !!x),
    });
    ctx.common.issues.push(issue);
}
class ParseStatus {
    constructor() {
        this.value = "valid";
    }
    dirty() {
        if (this.value === "valid")
            this.value = "dirty";
    }
    abort() {
        if (this.value !== "aborted")
            this.value = "aborted";
    }
    static mergeArray(status, results) {
        const arrayValue = [];
        for (const s of results) {
            if (s.status === "aborted")
                return INVALID;
            if (s.status === "dirty")
                status.dirty();
            arrayValue.push(s.value);
        }
        return { status: status.value, value: arrayValue };
    }
    static async mergeObjectAsync(status, pairs) {
        const syncPairs = [];
        for (const pair of pairs) {
            const key = await pair.key;
            const value = await pair.value;
            syncPairs.push({
                key,
                value,
            });
        }
        return ParseStatus.mergeObjectSync(status, syncPairs);
    }
    static mergeObjectSync(status, pairs) {
        const finalObject = {};
        for (const pair of pairs) {
            const { key, value } = pair;
            if (key.status === "aborted")
                return INVALID;
            if (value.status === "aborted")
                return INVALID;
            if (key.status === "dirty")
                status.dirty();
            if (value.status === "dirty")
                status.dirty();
            if (key.value !== "__proto__" && (typeof value.value !== "undefined" || pair.alwaysSet)) {
                finalObject[key.value] = value.value;
            }
        }
        return { status: status.value, value: finalObject };
    }
}
const INVALID = Object.freeze({
    status: "aborted",
});
const DIRTY = (value) => ({ status: "dirty", value });
const OK = (value) => ({ status: "valid", value });
const isAborted = (x) => x.status === "aborted";
const isDirty = (x) => x.status === "dirty";
const isValid = (x) => x.status === "valid";
const isAsync = (x) => typeof Promise !== "undefined" && x instanceof Promise;

var errorUtil;
(function (errorUtil) {
    errorUtil.errToObj = (message) => typeof message === "string" ? { message } : message || {};
    // biome-ignore lint:
    errorUtil.toString = (message) => typeof message === "string" ? message : message?.message;
})(errorUtil || (errorUtil = {}));

class ParseInputLazyPath {
    constructor(parent, value, path, key) {
        this._cachedPath = [];
        this.parent = parent;
        this.data = value;
        this._path = path;
        this._key = key;
    }
    get path() {
        if (!this._cachedPath.length) {
            if (Array.isArray(this._key)) {
                this._cachedPath.push(...this._path, ...this._key);
            }
            else {
                this._cachedPath.push(...this._path, this._key);
            }
        }
        return this._cachedPath;
    }
}
const handleResult = (ctx, result) => {
    if (isValid(result)) {
        return { success: true, data: result.value };
    }
    else {
        if (!ctx.common.issues.length) {
            throw new Error("Validation failed but no issues detected.");
        }
        return {
            success: false,
            get error() {
                if (this._error)
                    return this._error;
                const error = new ZodError(ctx.common.issues);
                this._error = error;
                return this._error;
            },
        };
    }
};
function processCreateParams(params) {
    if (!params)
        return {};
    const { errorMap, invalid_type_error, required_error, description } = params;
    if (errorMap && (invalid_type_error || required_error)) {
        throw new Error(`Can't use "invalid_type_error" or "required_error" in conjunction with custom error map.`);
    }
    if (errorMap)
        return { errorMap: errorMap, description };
    const customMap = (iss, ctx) => {
        const { message } = params;
        if (iss.code === "invalid_enum_value") {
            return { message: message ?? ctx.defaultError };
        }
        if (typeof ctx.data === "undefined") {
            return { message: message ?? required_error ?? ctx.defaultError };
        }
        if (iss.code !== "invalid_type")
            return { message: ctx.defaultError };
        return { message: message ?? invalid_type_error ?? ctx.defaultError };
    };
    return { errorMap: customMap, description };
}
class ZodType {
    get description() {
        return this._def.description;
    }
    _getType(input) {
        return getParsedType(input.data);
    }
    _getOrReturnCtx(input, ctx) {
        return (ctx || {
            common: input.parent.common,
            data: input.data,
            parsedType: getParsedType(input.data),
            schemaErrorMap: this._def.errorMap,
            path: input.path,
            parent: input.parent,
        });
    }
    _processInputParams(input) {
        return {
            status: new ParseStatus(),
            ctx: {
                common: input.parent.common,
                data: input.data,
                parsedType: getParsedType(input.data),
                schemaErrorMap: this._def.errorMap,
                path: input.path,
                parent: input.parent,
            },
        };
    }
    _parseSync(input) {
        const result = this._parse(input);
        if (isAsync(result)) {
            throw new Error("Synchronous parse encountered promise.");
        }
        return result;
    }
    _parseAsync(input) {
        const result = this._parse(input);
        return Promise.resolve(result);
    }
    parse(data, params) {
        const result = this.safeParse(data, params);
        if (result.success)
            return result.data;
        throw result.error;
    }
    safeParse(data, params) {
        const ctx = {
            common: {
                issues: [],
                async: params?.async ?? false,
                contextualErrorMap: params?.errorMap,
            },
            path: params?.path || [],
            schemaErrorMap: this._def.errorMap,
            parent: null,
            data,
            parsedType: getParsedType(data),
        };
        const result = this._parseSync({ data, path: ctx.path, parent: ctx });
        return handleResult(ctx, result);
    }
    "~validate"(data) {
        const ctx = {
            common: {
                issues: [],
                async: !!this["~standard"].async,
            },
            path: [],
            schemaErrorMap: this._def.errorMap,
            parent: null,
            data,
            parsedType: getParsedType(data),
        };
        if (!this["~standard"].async) {
            try {
                const result = this._parseSync({ data, path: [], parent: ctx });
                return isValid(result)
                    ? {
                        value: result.value,
                    }
                    : {
                        issues: ctx.common.issues,
                    };
            }
            catch (err) {
                if (err?.message?.toLowerCase()?.includes("encountered")) {
                    this["~standard"].async = true;
                }
                ctx.common = {
                    issues: [],
                    async: true,
                };
            }
        }
        return this._parseAsync({ data, path: [], parent: ctx }).then((result) => isValid(result)
            ? {
                value: result.value,
            }
            : {
                issues: ctx.common.issues,
            });
    }
    async parseAsync(data, params) {
        const result = await this.safeParseAsync(data, params);
        if (result.success)
            return result.data;
        throw result.error;
    }
    async safeParseAsync(data, params) {
        const ctx = {
            common: {
                issues: [],
                contextualErrorMap: params?.errorMap,
                async: true,
            },
            path: params?.path || [],
            schemaErrorMap: this._def.errorMap,
            parent: null,
            data,
            parsedType: getParsedType(data),
        };
        const maybeAsyncResult = this._parse({ data, path: ctx.path, parent: ctx });
        const result = await (isAsync(maybeAsyncResult) ? maybeAsyncResult : Promise.resolve(maybeAsyncResult));
        return handleResult(ctx, result);
    }
    refine(check, message) {
        const getIssueProperties = (val) => {
            if (typeof message === "string" || typeof message === "undefined") {
                return { message };
            }
            else if (typeof message === "function") {
                return message(val);
            }
            else {
                return message;
            }
        };
        return this._refinement((val, ctx) => {
            const result = check(val);
            const setError = () => ctx.addIssue({
                code: ZodIssueCode.custom,
                ...getIssueProperties(val),
            });
            if (typeof Promise !== "undefined" && result instanceof Promise) {
                return result.then((data) => {
                    if (!data) {
                        setError();
                        return false;
                    }
                    else {
                        return true;
                    }
                });
            }
            if (!result) {
                setError();
                return false;
            }
            else {
                return true;
            }
        });
    }
    refinement(check, refinementData) {
        return this._refinement((val, ctx) => {
            if (!check(val)) {
                ctx.addIssue(typeof refinementData === "function" ? refinementData(val, ctx) : refinementData);
                return false;
            }
            else {
                return true;
            }
        });
    }
    _refinement(refinement) {
        return new ZodEffects({
            schema: this,
            typeName: ZodFirstPartyTypeKind.ZodEffects,
            effect: { type: "refinement", refinement },
        });
    }
    superRefine(refinement) {
        return this._refinement(refinement);
    }
    constructor(def) {
        /** Alias of safeParseAsync */
        this.spa = this.safeParseAsync;
        this._def = def;
        this.parse = this.parse.bind(this);
        this.safeParse = this.safeParse.bind(this);
        this.parseAsync = this.parseAsync.bind(this);
        this.safeParseAsync = this.safeParseAsync.bind(this);
        this.spa = this.spa.bind(this);
        this.refine = this.refine.bind(this);
        this.refinement = this.refinement.bind(this);
        this.superRefine = this.superRefine.bind(this);
        this.optional = this.optional.bind(this);
        this.nullable = this.nullable.bind(this);
        this.nullish = this.nullish.bind(this);
        this.array = this.array.bind(this);
        this.promise = this.promise.bind(this);
        this.or = this.or.bind(this);
        this.and = this.and.bind(this);
        this.transform = this.transform.bind(this);
        this.brand = this.brand.bind(this);
        this.default = this.default.bind(this);
        this.catch = this.catch.bind(this);
        this.describe = this.describe.bind(this);
        this.pipe = this.pipe.bind(this);
        this.readonly = this.readonly.bind(this);
        this.isNullable = this.isNullable.bind(this);
        this.isOptional = this.isOptional.bind(this);
        this["~standard"] = {
            version: 1,
            vendor: "zod",
            validate: (data) => this["~validate"](data),
        };
    }
    optional() {
        return ZodOptional.create(this, this._def);
    }
    nullable() {
        return ZodNullable.create(this, this._def);
    }
    nullish() {
        return this.nullable().optional();
    }
    array() {
        return ZodArray.create(this);
    }
    promise() {
        return ZodPromise.create(this, this._def);
    }
    or(option) {
        return ZodUnion.create([this, option], this._def);
    }
    and(incoming) {
        return ZodIntersection.create(this, incoming, this._def);
    }
    transform(transform) {
        return new ZodEffects({
            ...processCreateParams(this._def),
            schema: this,
            typeName: ZodFirstPartyTypeKind.ZodEffects,
            effect: { type: "transform", transform },
        });
    }
    default(def) {
        const defaultValueFunc = typeof def === "function" ? def : () => def;
        return new ZodDefault({
            ...processCreateParams(this._def),
            innerType: this,
            defaultValue: defaultValueFunc,
            typeName: ZodFirstPartyTypeKind.ZodDefault,
        });
    }
    brand() {
        return new ZodBranded({
            typeName: ZodFirstPartyTypeKind.ZodBranded,
            type: this,
            ...processCreateParams(this._def),
        });
    }
    catch(def) {
        const catchValueFunc = typeof def === "function" ? def : () => def;
        return new ZodCatch({
            ...processCreateParams(this._def),
            innerType: this,
            catchValue: catchValueFunc,
            typeName: ZodFirstPartyTypeKind.ZodCatch,
        });
    }
    describe(description) {
        const This = this.constructor;
        return new This({
            ...this._def,
            description,
        });
    }
    pipe(target) {
        return ZodPipeline.create(this, target);
    }
    readonly() {
        return ZodReadonly.create(this);
    }
    isOptional() {
        return this.safeParse(undefined).success;
    }
    isNullable() {
        return this.safeParse(null).success;
    }
}
const cuidRegex = /^c[^\s-]{8,}$/i;
const cuid2Regex = /^[0-9a-z]+$/;
const ulidRegex = /^[0-9A-HJKMNP-TV-Z]{26}$/i;
// const uuidRegex =
//   /^([a-f0-9]{8}-[a-f0-9]{4}-[1-5][a-f0-9]{3}-[a-f0-9]{4}-[a-f0-9]{12}|00000000-0000-0000-0000-000000000000)$/i;
const uuidRegex = /^[0-9a-fA-F]{8}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{12}$/i;
const nanoidRegex = /^[a-z0-9_-]{21}$/i;
const jwtRegex = /^[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]*$/;
const durationRegex = /^[-+]?P(?!$)(?:(?:[-+]?\d+Y)|(?:[-+]?\d+[.,]\d+Y$))?(?:(?:[-+]?\d+M)|(?:[-+]?\d+[.,]\d+M$))?(?:(?:[-+]?\d+W)|(?:[-+]?\d+[.,]\d+W$))?(?:(?:[-+]?\d+D)|(?:[-+]?\d+[.,]\d+D$))?(?:T(?=[\d+-])(?:(?:[-+]?\d+H)|(?:[-+]?\d+[.,]\d+H$))?(?:(?:[-+]?\d+M)|(?:[-+]?\d+[.,]\d+M$))?(?:[-+]?\d+(?:[.,]\d+)?S)?)??$/;
// from https://stackoverflow.com/a/46181/1550155
// old version: too slow, didn't support unicode
// const emailRegex = /^((([a-z]|\d|[!#\$%&'\*\+\-\/=\?\^_`{\|}~]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])+(\.([a-z]|\d|[!#\$%&'\*\+\-\/=\?\^_`{\|}~]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])+)*)|((\x22)((((\x20|\x09)*(\x0d\x0a))?(\x20|\x09)+)?(([\x01-\x08\x0b\x0c\x0e-\x1f\x7f]|\x21|[\x23-\x5b]|[\x5d-\x7e]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(\\([\x01-\x09\x0b\x0c\x0d-\x7f]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]))))*(((\x20|\x09)*(\x0d\x0a))?(\x20|\x09)+)?(\x22)))@((([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))\.)+(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))$/i;
//old email regex
// const emailRegex = /^(([^<>()[\].,;:\s@"]+(\.[^<>()[\].,;:\s@"]+)*)|(".+"))@((?!-)([^<>()[\].,;:\s@"]+\.)+[^<>()[\].,;:\s@"]{1,})[^-<>()[\].,;:\s@"]$/i;
// eslint-disable-next-line
// const emailRegex =
//   /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[(((25[0-5])|(2[0-4][0-9])|(1[0-9]{2})|([0-9]{1,2}))\.){3}((25[0-5])|(2[0-4][0-9])|(1[0-9]{2})|([0-9]{1,2}))\])|(\[IPv6:(([a-f0-9]{1,4}:){7}|::([a-f0-9]{1,4}:){0,6}|([a-f0-9]{1,4}:){1}:([a-f0-9]{1,4}:){0,5}|([a-f0-9]{1,4}:){2}:([a-f0-9]{1,4}:){0,4}|([a-f0-9]{1,4}:){3}:([a-f0-9]{1,4}:){0,3}|([a-f0-9]{1,4}:){4}:([a-f0-9]{1,4}:){0,2}|([a-f0-9]{1,4}:){5}:([a-f0-9]{1,4}:){0,1})([a-f0-9]{1,4}|(((25[0-5])|(2[0-4][0-9])|(1[0-9]{2})|([0-9]{1,2}))\.){3}((25[0-5])|(2[0-4][0-9])|(1[0-9]{2})|([0-9]{1,2})))\])|([A-Za-z0-9]([A-Za-z0-9-]*[A-Za-z0-9])*(\.[A-Za-z]{2,})+))$/;
// const emailRegex =
//   /^[a-zA-Z0-9\.\!\#\$\%\&\'\*\+\/\=\?\^\_\`\{\|\}\~\-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
// const emailRegex =
//   /^(?:[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*|"(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21\x23-\x5b\x5d-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])*")@(?:(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?|\[(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?|[a-z0-9-]*[a-z0-9]:(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21-\x5a\x53-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])+)\])$/i;
const emailRegex = /^(?!\.)(?!.*\.\.)([A-Z0-9_'+\-\.]*)[A-Z0-9_+-]@([A-Z0-9][A-Z0-9\-]*\.)+[A-Z]{2,}$/i;
// const emailRegex =
//   /^[a-z0-9.!#$%&’*+/=?^_`{|}~-]+@[a-z0-9-]+(?:\.[a-z0-9\-]+)*$/i;
// from https://thekevinscott.com/emojis-in-javascript/#writing-a-regular-expression
const _emojiRegex = `^(\\p{Extended_Pictographic}|\\p{Emoji_Component})+$`;
let emojiRegex;
// faster, simpler, safer
const ipv4Regex = /^(?:(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])\.){3}(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])$/;
const ipv4CidrRegex = /^(?:(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])\.){3}(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])\/(3[0-2]|[12]?[0-9])$/;
// const ipv6Regex =
// /^(([a-f0-9]{1,4}:){7}|::([a-f0-9]{1,4}:){0,6}|([a-f0-9]{1,4}:){1}:([a-f0-9]{1,4}:){0,5}|([a-f0-9]{1,4}:){2}:([a-f0-9]{1,4}:){0,4}|([a-f0-9]{1,4}:){3}:([a-f0-9]{1,4}:){0,3}|([a-f0-9]{1,4}:){4}:([a-f0-9]{1,4}:){0,2}|([a-f0-9]{1,4}:){5}:([a-f0-9]{1,4}:){0,1})([a-f0-9]{1,4}|(((25[0-5])|(2[0-4][0-9])|(1[0-9]{2})|([0-9]{1,2}))\.){3}((25[0-5])|(2[0-4][0-9])|(1[0-9]{2})|([0-9]{1,2})))$/;
const ipv6Regex = /^(([0-9a-fA-F]{1,4}:){7,7}[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,7}:|([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,5}(:[0-9a-fA-F]{1,4}){1,2}|([0-9a-fA-F]{1,4}:){1,4}(:[0-9a-fA-F]{1,4}){1,3}|([0-9a-fA-F]{1,4}:){1,3}(:[0-9a-fA-F]{1,4}){1,4}|([0-9a-fA-F]{1,4}:){1,2}(:[0-9a-fA-F]{1,4}){1,5}|[0-9a-fA-F]{1,4}:((:[0-9a-fA-F]{1,4}){1,6})|:((:[0-9a-fA-F]{1,4}){1,7}|:)|fe80:(:[0-9a-fA-F]{0,4}){0,4}%[0-9a-zA-Z]{1,}|::(ffff(:0{1,4}){0,1}:){0,1}((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])|([0-9a-fA-F]{1,4}:){1,4}:((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9]))$/;
const ipv6CidrRegex = /^(([0-9a-fA-F]{1,4}:){7,7}[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,7}:|([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,5}(:[0-9a-fA-F]{1,4}){1,2}|([0-9a-fA-F]{1,4}:){1,4}(:[0-9a-fA-F]{1,4}){1,3}|([0-9a-fA-F]{1,4}:){1,3}(:[0-9a-fA-F]{1,4}){1,4}|([0-9a-fA-F]{1,4}:){1,2}(:[0-9a-fA-F]{1,4}){1,5}|[0-9a-fA-F]{1,4}:((:[0-9a-fA-F]{1,4}){1,6})|:((:[0-9a-fA-F]{1,4}){1,7}|:)|fe80:(:[0-9a-fA-F]{0,4}){0,4}%[0-9a-zA-Z]{1,}|::(ffff(:0{1,4}){0,1}:){0,1}((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])|([0-9a-fA-F]{1,4}:){1,4}:((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9]))\/(12[0-8]|1[01][0-9]|[1-9]?[0-9])$/;
// https://stackoverflow.com/questions/7860392/determine-if-string-is-in-base64-using-javascript
const base64Regex = /^([0-9a-zA-Z+/]{4})*(([0-9a-zA-Z+/]{2}==)|([0-9a-zA-Z+/]{3}=))?$/;
// https://base64.guru/standards/base64url
const base64urlRegex = /^([0-9a-zA-Z-_]{4})*(([0-9a-zA-Z-_]{2}(==)?)|([0-9a-zA-Z-_]{3}(=)?))?$/;
// simple
// const dateRegexSource = `\\d{4}-\\d{2}-\\d{2}`;
// no leap year validation
// const dateRegexSource = `\\d{4}-((0[13578]|10|12)-31|(0[13-9]|1[0-2])-30|(0[1-9]|1[0-2])-(0[1-9]|1\\d|2\\d))`;
// with leap year validation
const dateRegexSource = `((\\d\\d[2468][048]|\\d\\d[13579][26]|\\d\\d0[48]|[02468][048]00|[13579][26]00)-02-29|\\d{4}-((0[13578]|1[02])-(0[1-9]|[12]\\d|3[01])|(0[469]|11)-(0[1-9]|[12]\\d|30)|(02)-(0[1-9]|1\\d|2[0-8])))`;
const dateRegex = new RegExp(`^${dateRegexSource}$`);
function timeRegexSource(args) {
    let secondsRegexSource = `[0-5]\\d`;
    if (args.precision) {
        secondsRegexSource = `${secondsRegexSource}\\.\\d{${args.precision}}`;
    }
    else if (args.precision == null) {
        secondsRegexSource = `${secondsRegexSource}(\\.\\d+)?`;
    }
    const secondsQuantifier = args.precision ? "+" : "?"; // require seconds if precision is nonzero
    return `([01]\\d|2[0-3]):[0-5]\\d(:${secondsRegexSource})${secondsQuantifier}`;
}
function timeRegex(args) {
    return new RegExp(`^${timeRegexSource(args)}$`);
}
// Adapted from https://stackoverflow.com/a/3143231
function datetimeRegex(args) {
    let regex = `${dateRegexSource}T${timeRegexSource(args)}`;
    const opts = [];
    opts.push(args.local ? `Z?` : `Z`);
    if (args.offset)
        opts.push(`([+-]\\d{2}:?\\d{2})`);
    regex = `${regex}(${opts.join("|")})`;
    return new RegExp(`^${regex}$`);
}
function isValidIP(ip, version) {
    if ((version === "v4" || !version) && ipv4Regex.test(ip)) {
        return true;
    }
    if ((version === "v6" || !version) && ipv6Regex.test(ip)) {
        return true;
    }
    return false;
}
function isValidJWT(jwt, alg) {
    if (!jwtRegex.test(jwt))
        return false;
    try {
        const [header] = jwt.split(".");
        if (!header)
            return false;
        // Convert base64url to base64
        const base64 = header
            .replace(/-/g, "+")
            .replace(/_/g, "/")
            .padEnd(header.length + ((4 - (header.length % 4)) % 4), "=");
        const decoded = JSON.parse(atob(base64));
        if (typeof decoded !== "object" || decoded === null)
            return false;
        if ("typ" in decoded && decoded?.typ !== "JWT")
            return false;
        if (!decoded.alg)
            return false;
        if (alg && decoded.alg !== alg)
            return false;
        return true;
    }
    catch {
        return false;
    }
}
function isValidCidr(ip, version) {
    if ((version === "v4" || !version) && ipv4CidrRegex.test(ip)) {
        return true;
    }
    if ((version === "v6" || !version) && ipv6CidrRegex.test(ip)) {
        return true;
    }
    return false;
}
class ZodString extends ZodType {
    _parse(input) {
        if (this._def.coerce) {
            input.data = String(input.data);
        }
        const parsedType = this._getType(input);
        if (parsedType !== ZodParsedType.string) {
            const ctx = this._getOrReturnCtx(input);
            addIssueToContext(ctx, {
                code: ZodIssueCode.invalid_type,
                expected: ZodParsedType.string,
                received: ctx.parsedType,
            });
            return INVALID;
        }
        const status = new ParseStatus();
        let ctx = undefined;
        for (const check of this._def.checks) {
            if (check.kind === "min") {
                if (input.data.length < check.value) {
                    ctx = this._getOrReturnCtx(input, ctx);
                    addIssueToContext(ctx, {
                        code: ZodIssueCode.too_small,
                        minimum: check.value,
                        type: "string",
                        inclusive: true,
                        exact: false,
                        message: check.message,
                    });
                    status.dirty();
                }
            }
            else if (check.kind === "max") {
                if (input.data.length > check.value) {
                    ctx = this._getOrReturnCtx(input, ctx);
                    addIssueToContext(ctx, {
                        code: ZodIssueCode.too_big,
                        maximum: check.value,
                        type: "string",
                        inclusive: true,
                        exact: false,
                        message: check.message,
                    });
                    status.dirty();
                }
            }
            else if (check.kind === "length") {
                const tooBig = input.data.length > check.value;
                const tooSmall = input.data.length < check.value;
                if (tooBig || tooSmall) {
                    ctx = this._getOrReturnCtx(input, ctx);
                    if (tooBig) {
                        addIssueToContext(ctx, {
                            code: ZodIssueCode.too_big,
                            maximum: check.value,
                            type: "string",
                            inclusive: true,
                            exact: true,
                            message: check.message,
                        });
                    }
                    else if (tooSmall) {
                        addIssueToContext(ctx, {
                            code: ZodIssueCode.too_small,
                            minimum: check.value,
                            type: "string",
                            inclusive: true,
                            exact: true,
                            message: check.message,
                        });
                    }
                    status.dirty();
                }
            }
            else if (check.kind === "email") {
                if (!emailRegex.test(input.data)) {
                    ctx = this._getOrReturnCtx(input, ctx);
                    addIssueToContext(ctx, {
                        validation: "email",
                        code: ZodIssueCode.invalid_string,
                        message: check.message,
                    });
                    status.dirty();
                }
            }
            else if (check.kind === "emoji") {
                if (!emojiRegex) {
                    emojiRegex = new RegExp(_emojiRegex, "u");
                }
                if (!emojiRegex.test(input.data)) {
                    ctx = this._getOrReturnCtx(input, ctx);
                    addIssueToContext(ctx, {
                        validation: "emoji",
                        code: ZodIssueCode.invalid_string,
                        message: check.message,
                    });
                    status.dirty();
                }
            }
            else if (check.kind === "uuid") {
                if (!uuidRegex.test(input.data)) {
                    ctx = this._getOrReturnCtx(input, ctx);
                    addIssueToContext(ctx, {
                        validation: "uuid",
                        code: ZodIssueCode.invalid_string,
                        message: check.message,
                    });
                    status.dirty();
                }
            }
            else if (check.kind === "nanoid") {
                if (!nanoidRegex.test(input.data)) {
                    ctx = this._getOrReturnCtx(input, ctx);
                    addIssueToContext(ctx, {
                        validation: "nanoid",
                        code: ZodIssueCode.invalid_string,
                        message: check.message,
                    });
                    status.dirty();
                }
            }
            else if (check.kind === "cuid") {
                if (!cuidRegex.test(input.data)) {
                    ctx = this._getOrReturnCtx(input, ctx);
                    addIssueToContext(ctx, {
                        validation: "cuid",
                        code: ZodIssueCode.invalid_string,
                        message: check.message,
                    });
                    status.dirty();
                }
            }
            else if (check.kind === "cuid2") {
                if (!cuid2Regex.test(input.data)) {
                    ctx = this._getOrReturnCtx(input, ctx);
                    addIssueToContext(ctx, {
                        validation: "cuid2",
                        code: ZodIssueCode.invalid_string,
                        message: check.message,
                    });
                    status.dirty();
                }
            }
            else if (check.kind === "ulid") {
                if (!ulidRegex.test(input.data)) {
                    ctx = this._getOrReturnCtx(input, ctx);
                    addIssueToContext(ctx, {
                        validation: "ulid",
                        code: ZodIssueCode.invalid_string,
                        message: check.message,
                    });
                    status.dirty();
                }
            }
            else if (check.kind === "url") {
                try {
                    new URL(input.data);
                }
                catch {
                    ctx = this._getOrReturnCtx(input, ctx);
                    addIssueToContext(ctx, {
                        validation: "url",
                        code: ZodIssueCode.invalid_string,
                        message: check.message,
                    });
                    status.dirty();
                }
            }
            else if (check.kind === "regex") {
                check.regex.lastIndex = 0;
                const testResult = check.regex.test(input.data);
                if (!testResult) {
                    ctx = this._getOrReturnCtx(input, ctx);
                    addIssueToContext(ctx, {
                        validation: "regex",
                        code: ZodIssueCode.invalid_string,
                        message: check.message,
                    });
                    status.dirty();
                }
            }
            else if (check.kind === "trim") {
                input.data = input.data.trim();
            }
            else if (check.kind === "includes") {
                if (!input.data.includes(check.value, check.position)) {
                    ctx = this._getOrReturnCtx(input, ctx);
                    addIssueToContext(ctx, {
                        code: ZodIssueCode.invalid_string,
                        validation: { includes: check.value, position: check.position },
                        message: check.message,
                    });
                    status.dirty();
                }
            }
            else if (check.kind === "toLowerCase") {
                input.data = input.data.toLowerCase();
            }
            else if (check.kind === "toUpperCase") {
                input.data = input.data.toUpperCase();
            }
            else if (check.kind === "startsWith") {
                if (!input.data.startsWith(check.value)) {
                    ctx = this._getOrReturnCtx(input, ctx);
                    addIssueToContext(ctx, {
                        code: ZodIssueCode.invalid_string,
                        validation: { startsWith: check.value },
                        message: check.message,
                    });
                    status.dirty();
                }
            }
            else if (check.kind === "endsWith") {
                if (!input.data.endsWith(check.value)) {
                    ctx = this._getOrReturnCtx(input, ctx);
                    addIssueToContext(ctx, {
                        code: ZodIssueCode.invalid_string,
                        validation: { endsWith: check.value },
                        message: check.message,
                    });
                    status.dirty();
                }
            }
            else if (check.kind === "datetime") {
                const regex = datetimeRegex(check);
                if (!regex.test(input.data)) {
                    ctx = this._getOrReturnCtx(input, ctx);
                    addIssueToContext(ctx, {
                        code: ZodIssueCode.invalid_string,
                        validation: "datetime",
                        message: check.message,
                    });
                    status.dirty();
                }
            }
            else if (check.kind === "date") {
                const regex = dateRegex;
                if (!regex.test(input.data)) {
                    ctx = this._getOrReturnCtx(input, ctx);
                    addIssueToContext(ctx, {
                        code: ZodIssueCode.invalid_string,
                        validation: "date",
                        message: check.message,
                    });
                    status.dirty();
                }
            }
            else if (check.kind === "time") {
                const regex = timeRegex(check);
                if (!regex.test(input.data)) {
                    ctx = this._getOrReturnCtx(input, ctx);
                    addIssueToContext(ctx, {
                        code: ZodIssueCode.invalid_string,
                        validation: "time",
                        message: check.message,
                    });
                    status.dirty();
                }
            }
            else if (check.kind === "duration") {
                if (!durationRegex.test(input.data)) {
                    ctx = this._getOrReturnCtx(input, ctx);
                    addIssueToContext(ctx, {
                        validation: "duration",
                        code: ZodIssueCode.invalid_string,
                        message: check.message,
                    });
                    status.dirty();
                }
            }
            else if (check.kind === "ip") {
                if (!isValidIP(input.data, check.version)) {
                    ctx = this._getOrReturnCtx(input, ctx);
                    addIssueToContext(ctx, {
                        validation: "ip",
                        code: ZodIssueCode.invalid_string,
                        message: check.message,
                    });
                    status.dirty();
                }
            }
            else if (check.kind === "jwt") {
                if (!isValidJWT(input.data, check.alg)) {
                    ctx = this._getOrReturnCtx(input, ctx);
                    addIssueToContext(ctx, {
                        validation: "jwt",
                        code: ZodIssueCode.invalid_string,
                        message: check.message,
                    });
                    status.dirty();
                }
            }
            else if (check.kind === "cidr") {
                if (!isValidCidr(input.data, check.version)) {
                    ctx = this._getOrReturnCtx(input, ctx);
                    addIssueToContext(ctx, {
                        validation: "cidr",
                        code: ZodIssueCode.invalid_string,
                        message: check.message,
                    });
                    status.dirty();
                }
            }
            else if (check.kind === "base64") {
                if (!base64Regex.test(input.data)) {
                    ctx = this._getOrReturnCtx(input, ctx);
                    addIssueToContext(ctx, {
                        validation: "base64",
                        code: ZodIssueCode.invalid_string,
                        message: check.message,
                    });
                    status.dirty();
                }
            }
            else if (check.kind === "base64url") {
                if (!base64urlRegex.test(input.data)) {
                    ctx = this._getOrReturnCtx(input, ctx);
                    addIssueToContext(ctx, {
                        validation: "base64url",
                        code: ZodIssueCode.invalid_string,
                        message: check.message,
                    });
                    status.dirty();
                }
            }
            else {
                util$1.assertNever(check);
            }
        }
        return { status: status.value, value: input.data };
    }
    _regex(regex, validation, message) {
        return this.refinement((data) => regex.test(data), {
            validation,
            code: ZodIssueCode.invalid_string,
            ...errorUtil.errToObj(message),
        });
    }
    _addCheck(check) {
        return new ZodString({
            ...this._def,
            checks: [...this._def.checks, check],
        });
    }
    email(message) {
        return this._addCheck({ kind: "email", ...errorUtil.errToObj(message) });
    }
    url(message) {
        return this._addCheck({ kind: "url", ...errorUtil.errToObj(message) });
    }
    emoji(message) {
        return this._addCheck({ kind: "emoji", ...errorUtil.errToObj(message) });
    }
    uuid(message) {
        return this._addCheck({ kind: "uuid", ...errorUtil.errToObj(message) });
    }
    nanoid(message) {
        return this._addCheck({ kind: "nanoid", ...errorUtil.errToObj(message) });
    }
    cuid(message) {
        return this._addCheck({ kind: "cuid", ...errorUtil.errToObj(message) });
    }
    cuid2(message) {
        return this._addCheck({ kind: "cuid2", ...errorUtil.errToObj(message) });
    }
    ulid(message) {
        return this._addCheck({ kind: "ulid", ...errorUtil.errToObj(message) });
    }
    base64(message) {
        return this._addCheck({ kind: "base64", ...errorUtil.errToObj(message) });
    }
    base64url(message) {
        // base64url encoding is a modification of base64 that can safely be used in URLs and filenames
        return this._addCheck({
            kind: "base64url",
            ...errorUtil.errToObj(message),
        });
    }
    jwt(options) {
        return this._addCheck({ kind: "jwt", ...errorUtil.errToObj(options) });
    }
    ip(options) {
        return this._addCheck({ kind: "ip", ...errorUtil.errToObj(options) });
    }
    cidr(options) {
        return this._addCheck({ kind: "cidr", ...errorUtil.errToObj(options) });
    }
    datetime(options) {
        if (typeof options === "string") {
            return this._addCheck({
                kind: "datetime",
                precision: null,
                offset: false,
                local: false,
                message: options,
            });
        }
        return this._addCheck({
            kind: "datetime",
            precision: typeof options?.precision === "undefined" ? null : options?.precision,
            offset: options?.offset ?? false,
            local: options?.local ?? false,
            ...errorUtil.errToObj(options?.message),
        });
    }
    date(message) {
        return this._addCheck({ kind: "date", message });
    }
    time(options) {
        if (typeof options === "string") {
            return this._addCheck({
                kind: "time",
                precision: null,
                message: options,
            });
        }
        return this._addCheck({
            kind: "time",
            precision: typeof options?.precision === "undefined" ? null : options?.precision,
            ...errorUtil.errToObj(options?.message),
        });
    }
    duration(message) {
        return this._addCheck({ kind: "duration", ...errorUtil.errToObj(message) });
    }
    regex(regex, message) {
        return this._addCheck({
            kind: "regex",
            regex: regex,
            ...errorUtil.errToObj(message),
        });
    }
    includes(value, options) {
        return this._addCheck({
            kind: "includes",
            value: value,
            position: options?.position,
            ...errorUtil.errToObj(options?.message),
        });
    }
    startsWith(value, message) {
        return this._addCheck({
            kind: "startsWith",
            value: value,
            ...errorUtil.errToObj(message),
        });
    }
    endsWith(value, message) {
        return this._addCheck({
            kind: "endsWith",
            value: value,
            ...errorUtil.errToObj(message),
        });
    }
    min(minLength, message) {
        return this._addCheck({
            kind: "min",
            value: minLength,
            ...errorUtil.errToObj(message),
        });
    }
    max(maxLength, message) {
        return this._addCheck({
            kind: "max",
            value: maxLength,
            ...errorUtil.errToObj(message),
        });
    }
    length(len, message) {
        return this._addCheck({
            kind: "length",
            value: len,
            ...errorUtil.errToObj(message),
        });
    }
    /**
     * Equivalent to `.min(1)`
     */
    nonempty(message) {
        return this.min(1, errorUtil.errToObj(message));
    }
    trim() {
        return new ZodString({
            ...this._def,
            checks: [...this._def.checks, { kind: "trim" }],
        });
    }
    toLowerCase() {
        return new ZodString({
            ...this._def,
            checks: [...this._def.checks, { kind: "toLowerCase" }],
        });
    }
    toUpperCase() {
        return new ZodString({
            ...this._def,
            checks: [...this._def.checks, { kind: "toUpperCase" }],
        });
    }
    get isDatetime() {
        return !!this._def.checks.find((ch) => ch.kind === "datetime");
    }
    get isDate() {
        return !!this._def.checks.find((ch) => ch.kind === "date");
    }
    get isTime() {
        return !!this._def.checks.find((ch) => ch.kind === "time");
    }
    get isDuration() {
        return !!this._def.checks.find((ch) => ch.kind === "duration");
    }
    get isEmail() {
        return !!this._def.checks.find((ch) => ch.kind === "email");
    }
    get isURL() {
        return !!this._def.checks.find((ch) => ch.kind === "url");
    }
    get isEmoji() {
        return !!this._def.checks.find((ch) => ch.kind === "emoji");
    }
    get isUUID() {
        return !!this._def.checks.find((ch) => ch.kind === "uuid");
    }
    get isNANOID() {
        return !!this._def.checks.find((ch) => ch.kind === "nanoid");
    }
    get isCUID() {
        return !!this._def.checks.find((ch) => ch.kind === "cuid");
    }
    get isCUID2() {
        return !!this._def.checks.find((ch) => ch.kind === "cuid2");
    }
    get isULID() {
        return !!this._def.checks.find((ch) => ch.kind === "ulid");
    }
    get isIP() {
        return !!this._def.checks.find((ch) => ch.kind === "ip");
    }
    get isCIDR() {
        return !!this._def.checks.find((ch) => ch.kind === "cidr");
    }
    get isBase64() {
        return !!this._def.checks.find((ch) => ch.kind === "base64");
    }
    get isBase64url() {
        // base64url encoding is a modification of base64 that can safely be used in URLs and filenames
        return !!this._def.checks.find((ch) => ch.kind === "base64url");
    }
    get minLength() {
        let min = null;
        for (const ch of this._def.checks) {
            if (ch.kind === "min") {
                if (min === null || ch.value > min)
                    min = ch.value;
            }
        }
        return min;
    }
    get maxLength() {
        let max = null;
        for (const ch of this._def.checks) {
            if (ch.kind === "max") {
                if (max === null || ch.value < max)
                    max = ch.value;
            }
        }
        return max;
    }
}
ZodString.create = (params) => {
    return new ZodString({
        checks: [],
        typeName: ZodFirstPartyTypeKind.ZodString,
        coerce: params?.coerce ?? false,
        ...processCreateParams(params),
    });
};
// https://stackoverflow.com/questions/3966484/why-does-modulus-operator-return-fractional-number-in-javascript/31711034#31711034
function floatSafeRemainder(val, step) {
    const valDecCount = (val.toString().split(".")[1] || "").length;
    const stepDecCount = (step.toString().split(".")[1] || "").length;
    const decCount = valDecCount > stepDecCount ? valDecCount : stepDecCount;
    const valInt = Number.parseInt(val.toFixed(decCount).replace(".", ""));
    const stepInt = Number.parseInt(step.toFixed(decCount).replace(".", ""));
    return (valInt % stepInt) / 10 ** decCount;
}
class ZodNumber extends ZodType {
    constructor() {
        super(...arguments);
        this.min = this.gte;
        this.max = this.lte;
        this.step = this.multipleOf;
    }
    _parse(input) {
        if (this._def.coerce) {
            input.data = Number(input.data);
        }
        const parsedType = this._getType(input);
        if (parsedType !== ZodParsedType.number) {
            const ctx = this._getOrReturnCtx(input);
            addIssueToContext(ctx, {
                code: ZodIssueCode.invalid_type,
                expected: ZodParsedType.number,
                received: ctx.parsedType,
            });
            return INVALID;
        }
        let ctx = undefined;
        const status = new ParseStatus();
        for (const check of this._def.checks) {
            if (check.kind === "int") {
                if (!util$1.isInteger(input.data)) {
                    ctx = this._getOrReturnCtx(input, ctx);
                    addIssueToContext(ctx, {
                        code: ZodIssueCode.invalid_type,
                        expected: "integer",
                        received: "float",
                        message: check.message,
                    });
                    status.dirty();
                }
            }
            else if (check.kind === "min") {
                const tooSmall = check.inclusive ? input.data < check.value : input.data <= check.value;
                if (tooSmall) {
                    ctx = this._getOrReturnCtx(input, ctx);
                    addIssueToContext(ctx, {
                        code: ZodIssueCode.too_small,
                        minimum: check.value,
                        type: "number",
                        inclusive: check.inclusive,
                        exact: false,
                        message: check.message,
                    });
                    status.dirty();
                }
            }
            else if (check.kind === "max") {
                const tooBig = check.inclusive ? input.data > check.value : input.data >= check.value;
                if (tooBig) {
                    ctx = this._getOrReturnCtx(input, ctx);
                    addIssueToContext(ctx, {
                        code: ZodIssueCode.too_big,
                        maximum: check.value,
                        type: "number",
                        inclusive: check.inclusive,
                        exact: false,
                        message: check.message,
                    });
                    status.dirty();
                }
            }
            else if (check.kind === "multipleOf") {
                if (floatSafeRemainder(input.data, check.value) !== 0) {
                    ctx = this._getOrReturnCtx(input, ctx);
                    addIssueToContext(ctx, {
                        code: ZodIssueCode.not_multiple_of,
                        multipleOf: check.value,
                        message: check.message,
                    });
                    status.dirty();
                }
            }
            else if (check.kind === "finite") {
                if (!Number.isFinite(input.data)) {
                    ctx = this._getOrReturnCtx(input, ctx);
                    addIssueToContext(ctx, {
                        code: ZodIssueCode.not_finite,
                        message: check.message,
                    });
                    status.dirty();
                }
            }
            else {
                util$1.assertNever(check);
            }
        }
        return { status: status.value, value: input.data };
    }
    gte(value, message) {
        return this.setLimit("min", value, true, errorUtil.toString(message));
    }
    gt(value, message) {
        return this.setLimit("min", value, false, errorUtil.toString(message));
    }
    lte(value, message) {
        return this.setLimit("max", value, true, errorUtil.toString(message));
    }
    lt(value, message) {
        return this.setLimit("max", value, false, errorUtil.toString(message));
    }
    setLimit(kind, value, inclusive, message) {
        return new ZodNumber({
            ...this._def,
            checks: [
                ...this._def.checks,
                {
                    kind,
                    value,
                    inclusive,
                    message: errorUtil.toString(message),
                },
            ],
        });
    }
    _addCheck(check) {
        return new ZodNumber({
            ...this._def,
            checks: [...this._def.checks, check],
        });
    }
    int(message) {
        return this._addCheck({
            kind: "int",
            message: errorUtil.toString(message),
        });
    }
    positive(message) {
        return this._addCheck({
            kind: "min",
            value: 0,
            inclusive: false,
            message: errorUtil.toString(message),
        });
    }
    negative(message) {
        return this._addCheck({
            kind: "max",
            value: 0,
            inclusive: false,
            message: errorUtil.toString(message),
        });
    }
    nonpositive(message) {
        return this._addCheck({
            kind: "max",
            value: 0,
            inclusive: true,
            message: errorUtil.toString(message),
        });
    }
    nonnegative(message) {
        return this._addCheck({
            kind: "min",
            value: 0,
            inclusive: true,
            message: errorUtil.toString(message),
        });
    }
    multipleOf(value, message) {
        return this._addCheck({
            kind: "multipleOf",
            value: value,
            message: errorUtil.toString(message),
        });
    }
    finite(message) {
        return this._addCheck({
            kind: "finite",
            message: errorUtil.toString(message),
        });
    }
    safe(message) {
        return this._addCheck({
            kind: "min",
            inclusive: true,
            value: Number.MIN_SAFE_INTEGER,
            message: errorUtil.toString(message),
        })._addCheck({
            kind: "max",
            inclusive: true,
            value: Number.MAX_SAFE_INTEGER,
            message: errorUtil.toString(message),
        });
    }
    get minValue() {
        let min = null;
        for (const ch of this._def.checks) {
            if (ch.kind === "min") {
                if (min === null || ch.value > min)
                    min = ch.value;
            }
        }
        return min;
    }
    get maxValue() {
        let max = null;
        for (const ch of this._def.checks) {
            if (ch.kind === "max") {
                if (max === null || ch.value < max)
                    max = ch.value;
            }
        }
        return max;
    }
    get isInt() {
        return !!this._def.checks.find((ch) => ch.kind === "int" || (ch.kind === "multipleOf" && util$1.isInteger(ch.value)));
    }
    get isFinite() {
        let max = null;
        let min = null;
        for (const ch of this._def.checks) {
            if (ch.kind === "finite" || ch.kind === "int" || ch.kind === "multipleOf") {
                return true;
            }
            else if (ch.kind === "min") {
                if (min === null || ch.value > min)
                    min = ch.value;
            }
            else if (ch.kind === "max") {
                if (max === null || ch.value < max)
                    max = ch.value;
            }
        }
        return Number.isFinite(min) && Number.isFinite(max);
    }
}
ZodNumber.create = (params) => {
    return new ZodNumber({
        checks: [],
        typeName: ZodFirstPartyTypeKind.ZodNumber,
        coerce: params?.coerce || false,
        ...processCreateParams(params),
    });
};
class ZodBigInt extends ZodType {
    constructor() {
        super(...arguments);
        this.min = this.gte;
        this.max = this.lte;
    }
    _parse(input) {
        if (this._def.coerce) {
            try {
                input.data = BigInt(input.data);
            }
            catch {
                return this._getInvalidInput(input);
            }
        }
        const parsedType = this._getType(input);
        if (parsedType !== ZodParsedType.bigint) {
            return this._getInvalidInput(input);
        }
        let ctx = undefined;
        const status = new ParseStatus();
        for (const check of this._def.checks) {
            if (check.kind === "min") {
                const tooSmall = check.inclusive ? input.data < check.value : input.data <= check.value;
                if (tooSmall) {
                    ctx = this._getOrReturnCtx(input, ctx);
                    addIssueToContext(ctx, {
                        code: ZodIssueCode.too_small,
                        type: "bigint",
                        minimum: check.value,
                        inclusive: check.inclusive,
                        message: check.message,
                    });
                    status.dirty();
                }
            }
            else if (check.kind === "max") {
                const tooBig = check.inclusive ? input.data > check.value : input.data >= check.value;
                if (tooBig) {
                    ctx = this._getOrReturnCtx(input, ctx);
                    addIssueToContext(ctx, {
                        code: ZodIssueCode.too_big,
                        type: "bigint",
                        maximum: check.value,
                        inclusive: check.inclusive,
                        message: check.message,
                    });
                    status.dirty();
                }
            }
            else if (check.kind === "multipleOf") {
                if (input.data % check.value !== BigInt(0)) {
                    ctx = this._getOrReturnCtx(input, ctx);
                    addIssueToContext(ctx, {
                        code: ZodIssueCode.not_multiple_of,
                        multipleOf: check.value,
                        message: check.message,
                    });
                    status.dirty();
                }
            }
            else {
                util$1.assertNever(check);
            }
        }
        return { status: status.value, value: input.data };
    }
    _getInvalidInput(input) {
        const ctx = this._getOrReturnCtx(input);
        addIssueToContext(ctx, {
            code: ZodIssueCode.invalid_type,
            expected: ZodParsedType.bigint,
            received: ctx.parsedType,
        });
        return INVALID;
    }
    gte(value, message) {
        return this.setLimit("min", value, true, errorUtil.toString(message));
    }
    gt(value, message) {
        return this.setLimit("min", value, false, errorUtil.toString(message));
    }
    lte(value, message) {
        return this.setLimit("max", value, true, errorUtil.toString(message));
    }
    lt(value, message) {
        return this.setLimit("max", value, false, errorUtil.toString(message));
    }
    setLimit(kind, value, inclusive, message) {
        return new ZodBigInt({
            ...this._def,
            checks: [
                ...this._def.checks,
                {
                    kind,
                    value,
                    inclusive,
                    message: errorUtil.toString(message),
                },
            ],
        });
    }
    _addCheck(check) {
        return new ZodBigInt({
            ...this._def,
            checks: [...this._def.checks, check],
        });
    }
    positive(message) {
        return this._addCheck({
            kind: "min",
            value: BigInt(0),
            inclusive: false,
            message: errorUtil.toString(message),
        });
    }
    negative(message) {
        return this._addCheck({
            kind: "max",
            value: BigInt(0),
            inclusive: false,
            message: errorUtil.toString(message),
        });
    }
    nonpositive(message) {
        return this._addCheck({
            kind: "max",
            value: BigInt(0),
            inclusive: true,
            message: errorUtil.toString(message),
        });
    }
    nonnegative(message) {
        return this._addCheck({
            kind: "min",
            value: BigInt(0),
            inclusive: true,
            message: errorUtil.toString(message),
        });
    }
    multipleOf(value, message) {
        return this._addCheck({
            kind: "multipleOf",
            value,
            message: errorUtil.toString(message),
        });
    }
    get minValue() {
        let min = null;
        for (const ch of this._def.checks) {
            if (ch.kind === "min") {
                if (min === null || ch.value > min)
                    min = ch.value;
            }
        }
        return min;
    }
    get maxValue() {
        let max = null;
        for (const ch of this._def.checks) {
            if (ch.kind === "max") {
                if (max === null || ch.value < max)
                    max = ch.value;
            }
        }
        return max;
    }
}
ZodBigInt.create = (params) => {
    return new ZodBigInt({
        checks: [],
        typeName: ZodFirstPartyTypeKind.ZodBigInt,
        coerce: params?.coerce ?? false,
        ...processCreateParams(params),
    });
};
class ZodBoolean extends ZodType {
    _parse(input) {
        if (this._def.coerce) {
            input.data = Boolean(input.data);
        }
        const parsedType = this._getType(input);
        if (parsedType !== ZodParsedType.boolean) {
            const ctx = this._getOrReturnCtx(input);
            addIssueToContext(ctx, {
                code: ZodIssueCode.invalid_type,
                expected: ZodParsedType.boolean,
                received: ctx.parsedType,
            });
            return INVALID;
        }
        return OK(input.data);
    }
}
ZodBoolean.create = (params) => {
    return new ZodBoolean({
        typeName: ZodFirstPartyTypeKind.ZodBoolean,
        coerce: params?.coerce || false,
        ...processCreateParams(params),
    });
};
class ZodDate extends ZodType {
    _parse(input) {
        if (this._def.coerce) {
            input.data = new Date(input.data);
        }
        const parsedType = this._getType(input);
        if (parsedType !== ZodParsedType.date) {
            const ctx = this._getOrReturnCtx(input);
            addIssueToContext(ctx, {
                code: ZodIssueCode.invalid_type,
                expected: ZodParsedType.date,
                received: ctx.parsedType,
            });
            return INVALID;
        }
        if (Number.isNaN(input.data.getTime())) {
            const ctx = this._getOrReturnCtx(input);
            addIssueToContext(ctx, {
                code: ZodIssueCode.invalid_date,
            });
            return INVALID;
        }
        const status = new ParseStatus();
        let ctx = undefined;
        for (const check of this._def.checks) {
            if (check.kind === "min") {
                if (input.data.getTime() < check.value) {
                    ctx = this._getOrReturnCtx(input, ctx);
                    addIssueToContext(ctx, {
                        code: ZodIssueCode.too_small,
                        message: check.message,
                        inclusive: true,
                        exact: false,
                        minimum: check.value,
                        type: "date",
                    });
                    status.dirty();
                }
            }
            else if (check.kind === "max") {
                if (input.data.getTime() > check.value) {
                    ctx = this._getOrReturnCtx(input, ctx);
                    addIssueToContext(ctx, {
                        code: ZodIssueCode.too_big,
                        message: check.message,
                        inclusive: true,
                        exact: false,
                        maximum: check.value,
                        type: "date",
                    });
                    status.dirty();
                }
            }
            else {
                util$1.assertNever(check);
            }
        }
        return {
            status: status.value,
            value: new Date(input.data.getTime()),
        };
    }
    _addCheck(check) {
        return new ZodDate({
            ...this._def,
            checks: [...this._def.checks, check],
        });
    }
    min(minDate, message) {
        return this._addCheck({
            kind: "min",
            value: minDate.getTime(),
            message: errorUtil.toString(message),
        });
    }
    max(maxDate, message) {
        return this._addCheck({
            kind: "max",
            value: maxDate.getTime(),
            message: errorUtil.toString(message),
        });
    }
    get minDate() {
        let min = null;
        for (const ch of this._def.checks) {
            if (ch.kind === "min") {
                if (min === null || ch.value > min)
                    min = ch.value;
            }
        }
        return min != null ? new Date(min) : null;
    }
    get maxDate() {
        let max = null;
        for (const ch of this._def.checks) {
            if (ch.kind === "max") {
                if (max === null || ch.value < max)
                    max = ch.value;
            }
        }
        return max != null ? new Date(max) : null;
    }
}
ZodDate.create = (params) => {
    return new ZodDate({
        checks: [],
        coerce: params?.coerce || false,
        typeName: ZodFirstPartyTypeKind.ZodDate,
        ...processCreateParams(params),
    });
};
class ZodSymbol extends ZodType {
    _parse(input) {
        const parsedType = this._getType(input);
        if (parsedType !== ZodParsedType.symbol) {
            const ctx = this._getOrReturnCtx(input);
            addIssueToContext(ctx, {
                code: ZodIssueCode.invalid_type,
                expected: ZodParsedType.symbol,
                received: ctx.parsedType,
            });
            return INVALID;
        }
        return OK(input.data);
    }
}
ZodSymbol.create = (params) => {
    return new ZodSymbol({
        typeName: ZodFirstPartyTypeKind.ZodSymbol,
        ...processCreateParams(params),
    });
};
class ZodUndefined extends ZodType {
    _parse(input) {
        const parsedType = this._getType(input);
        if (parsedType !== ZodParsedType.undefined) {
            const ctx = this._getOrReturnCtx(input);
            addIssueToContext(ctx, {
                code: ZodIssueCode.invalid_type,
                expected: ZodParsedType.undefined,
                received: ctx.parsedType,
            });
            return INVALID;
        }
        return OK(input.data);
    }
}
ZodUndefined.create = (params) => {
    return new ZodUndefined({
        typeName: ZodFirstPartyTypeKind.ZodUndefined,
        ...processCreateParams(params),
    });
};
class ZodNull extends ZodType {
    _parse(input) {
        const parsedType = this._getType(input);
        if (parsedType !== ZodParsedType.null) {
            const ctx = this._getOrReturnCtx(input);
            addIssueToContext(ctx, {
                code: ZodIssueCode.invalid_type,
                expected: ZodParsedType.null,
                received: ctx.parsedType,
            });
            return INVALID;
        }
        return OK(input.data);
    }
}
ZodNull.create = (params) => {
    return new ZodNull({
        typeName: ZodFirstPartyTypeKind.ZodNull,
        ...processCreateParams(params),
    });
};
class ZodAny extends ZodType {
    constructor() {
        super(...arguments);
        // to prevent instances of other classes from extending ZodAny. this causes issues with catchall in ZodObject.
        this._any = true;
    }
    _parse(input) {
        return OK(input.data);
    }
}
ZodAny.create = (params) => {
    return new ZodAny({
        typeName: ZodFirstPartyTypeKind.ZodAny,
        ...processCreateParams(params),
    });
};
class ZodUnknown extends ZodType {
    constructor() {
        super(...arguments);
        // required
        this._unknown = true;
    }
    _parse(input) {
        return OK(input.data);
    }
}
ZodUnknown.create = (params) => {
    return new ZodUnknown({
        typeName: ZodFirstPartyTypeKind.ZodUnknown,
        ...processCreateParams(params),
    });
};
class ZodNever extends ZodType {
    _parse(input) {
        const ctx = this._getOrReturnCtx(input);
        addIssueToContext(ctx, {
            code: ZodIssueCode.invalid_type,
            expected: ZodParsedType.never,
            received: ctx.parsedType,
        });
        return INVALID;
    }
}
ZodNever.create = (params) => {
    return new ZodNever({
        typeName: ZodFirstPartyTypeKind.ZodNever,
        ...processCreateParams(params),
    });
};
class ZodVoid extends ZodType {
    _parse(input) {
        const parsedType = this._getType(input);
        if (parsedType !== ZodParsedType.undefined) {
            const ctx = this._getOrReturnCtx(input);
            addIssueToContext(ctx, {
                code: ZodIssueCode.invalid_type,
                expected: ZodParsedType.void,
                received: ctx.parsedType,
            });
            return INVALID;
        }
        return OK(input.data);
    }
}
ZodVoid.create = (params) => {
    return new ZodVoid({
        typeName: ZodFirstPartyTypeKind.ZodVoid,
        ...processCreateParams(params),
    });
};
class ZodArray extends ZodType {
    _parse(input) {
        const { ctx, status } = this._processInputParams(input);
        const def = this._def;
        if (ctx.parsedType !== ZodParsedType.array) {
            addIssueToContext(ctx, {
                code: ZodIssueCode.invalid_type,
                expected: ZodParsedType.array,
                received: ctx.parsedType,
            });
            return INVALID;
        }
        if (def.exactLength !== null) {
            const tooBig = ctx.data.length > def.exactLength.value;
            const tooSmall = ctx.data.length < def.exactLength.value;
            if (tooBig || tooSmall) {
                addIssueToContext(ctx, {
                    code: tooBig ? ZodIssueCode.too_big : ZodIssueCode.too_small,
                    minimum: (tooSmall ? def.exactLength.value : undefined),
                    maximum: (tooBig ? def.exactLength.value : undefined),
                    type: "array",
                    inclusive: true,
                    exact: true,
                    message: def.exactLength.message,
                });
                status.dirty();
            }
        }
        if (def.minLength !== null) {
            if (ctx.data.length < def.minLength.value) {
                addIssueToContext(ctx, {
                    code: ZodIssueCode.too_small,
                    minimum: def.minLength.value,
                    type: "array",
                    inclusive: true,
                    exact: false,
                    message: def.minLength.message,
                });
                status.dirty();
            }
        }
        if (def.maxLength !== null) {
            if (ctx.data.length > def.maxLength.value) {
                addIssueToContext(ctx, {
                    code: ZodIssueCode.too_big,
                    maximum: def.maxLength.value,
                    type: "array",
                    inclusive: true,
                    exact: false,
                    message: def.maxLength.message,
                });
                status.dirty();
            }
        }
        if (ctx.common.async) {
            return Promise.all([...ctx.data].map((item, i) => {
                return def.type._parseAsync(new ParseInputLazyPath(ctx, item, ctx.path, i));
            })).then((result) => {
                return ParseStatus.mergeArray(status, result);
            });
        }
        const result = [...ctx.data].map((item, i) => {
            return def.type._parseSync(new ParseInputLazyPath(ctx, item, ctx.path, i));
        });
        return ParseStatus.mergeArray(status, result);
    }
    get element() {
        return this._def.type;
    }
    min(minLength, message) {
        return new ZodArray({
            ...this._def,
            minLength: { value: minLength, message: errorUtil.toString(message) },
        });
    }
    max(maxLength, message) {
        return new ZodArray({
            ...this._def,
            maxLength: { value: maxLength, message: errorUtil.toString(message) },
        });
    }
    length(len, message) {
        return new ZodArray({
            ...this._def,
            exactLength: { value: len, message: errorUtil.toString(message) },
        });
    }
    nonempty(message) {
        return this.min(1, message);
    }
}
ZodArray.create = (schema, params) => {
    return new ZodArray({
        type: schema,
        minLength: null,
        maxLength: null,
        exactLength: null,
        typeName: ZodFirstPartyTypeKind.ZodArray,
        ...processCreateParams(params),
    });
};
function deepPartialify(schema) {
    if (schema instanceof ZodObject) {
        const newShape = {};
        for (const key in schema.shape) {
            const fieldSchema = schema.shape[key];
            newShape[key] = ZodOptional.create(deepPartialify(fieldSchema));
        }
        return new ZodObject({
            ...schema._def,
            shape: () => newShape,
        });
    }
    else if (schema instanceof ZodArray) {
        return new ZodArray({
            ...schema._def,
            type: deepPartialify(schema.element),
        });
    }
    else if (schema instanceof ZodOptional) {
        return ZodOptional.create(deepPartialify(schema.unwrap()));
    }
    else if (schema instanceof ZodNullable) {
        return ZodNullable.create(deepPartialify(schema.unwrap()));
    }
    else if (schema instanceof ZodTuple) {
        return ZodTuple.create(schema.items.map((item) => deepPartialify(item)));
    }
    else {
        return schema;
    }
}
class ZodObject extends ZodType {
    constructor() {
        super(...arguments);
        this._cached = null;
        /**
         * @deprecated In most cases, this is no longer needed - unknown properties are now silently stripped.
         * If you want to pass through unknown properties, use `.passthrough()` instead.
         */
        this.nonstrict = this.passthrough;
        // extend<
        //   Augmentation extends ZodRawShape,
        //   NewOutput extends util.flatten<{
        //     [k in keyof Augmentation | keyof Output]: k extends keyof Augmentation
        //       ? Augmentation[k]["_output"]
        //       : k extends keyof Output
        //       ? Output[k]
        //       : never;
        //   }>,
        //   NewInput extends util.flatten<{
        //     [k in keyof Augmentation | keyof Input]: k extends keyof Augmentation
        //       ? Augmentation[k]["_input"]
        //       : k extends keyof Input
        //       ? Input[k]
        //       : never;
        //   }>
        // >(
        //   augmentation: Augmentation
        // ): ZodObject<
        //   extendShape<T, Augmentation>,
        //   UnknownKeys,
        //   Catchall,
        //   NewOutput,
        //   NewInput
        // > {
        //   return new ZodObject({
        //     ...this._def,
        //     shape: () => ({
        //       ...this._def.shape(),
        //       ...augmentation,
        //     }),
        //   }) as any;
        // }
        /**
         * @deprecated Use `.extend` instead
         *  */
        this.augment = this.extend;
    }
    _getCached() {
        if (this._cached !== null)
            return this._cached;
        const shape = this._def.shape();
        const keys = util$1.objectKeys(shape);
        this._cached = { shape, keys };
        return this._cached;
    }
    _parse(input) {
        const parsedType = this._getType(input);
        if (parsedType !== ZodParsedType.object) {
            const ctx = this._getOrReturnCtx(input);
            addIssueToContext(ctx, {
                code: ZodIssueCode.invalid_type,
                expected: ZodParsedType.object,
                received: ctx.parsedType,
            });
            return INVALID;
        }
        const { status, ctx } = this._processInputParams(input);
        const { shape, keys: shapeKeys } = this._getCached();
        const extraKeys = [];
        if (!(this._def.catchall instanceof ZodNever && this._def.unknownKeys === "strip")) {
            for (const key in ctx.data) {
                if (!shapeKeys.includes(key)) {
                    extraKeys.push(key);
                }
            }
        }
        const pairs = [];
        for (const key of shapeKeys) {
            const keyValidator = shape[key];
            const value = ctx.data[key];
            pairs.push({
                key: { status: "valid", value: key },
                value: keyValidator._parse(new ParseInputLazyPath(ctx, value, ctx.path, key)),
                alwaysSet: key in ctx.data,
            });
        }
        if (this._def.catchall instanceof ZodNever) {
            const unknownKeys = this._def.unknownKeys;
            if (unknownKeys === "passthrough") {
                for (const key of extraKeys) {
                    pairs.push({
                        key: { status: "valid", value: key },
                        value: { status: "valid", value: ctx.data[key] },
                    });
                }
            }
            else if (unknownKeys === "strict") {
                if (extraKeys.length > 0) {
                    addIssueToContext(ctx, {
                        code: ZodIssueCode.unrecognized_keys,
                        keys: extraKeys,
                    });
                    status.dirty();
                }
            }
            else if (unknownKeys === "strip") ;
            else {
                throw new Error(`Internal ZodObject error: invalid unknownKeys value.`);
            }
        }
        else {
            // run catchall validation
            const catchall = this._def.catchall;
            for (const key of extraKeys) {
                const value = ctx.data[key];
                pairs.push({
                    key: { status: "valid", value: key },
                    value: catchall._parse(new ParseInputLazyPath(ctx, value, ctx.path, key) //, ctx.child(key), value, getParsedType(value)
                    ),
                    alwaysSet: key in ctx.data,
                });
            }
        }
        if (ctx.common.async) {
            return Promise.resolve()
                .then(async () => {
                const syncPairs = [];
                for (const pair of pairs) {
                    const key = await pair.key;
                    const value = await pair.value;
                    syncPairs.push({
                        key,
                        value,
                        alwaysSet: pair.alwaysSet,
                    });
                }
                return syncPairs;
            })
                .then((syncPairs) => {
                return ParseStatus.mergeObjectSync(status, syncPairs);
            });
        }
        else {
            return ParseStatus.mergeObjectSync(status, pairs);
        }
    }
    get shape() {
        return this._def.shape();
    }
    strict(message) {
        errorUtil.errToObj;
        return new ZodObject({
            ...this._def,
            unknownKeys: "strict",
            ...(message !== undefined
                ? {
                    errorMap: (issue, ctx) => {
                        const defaultError = this._def.errorMap?.(issue, ctx).message ?? ctx.defaultError;
                        if (issue.code === "unrecognized_keys")
                            return {
                                message: errorUtil.errToObj(message).message ?? defaultError,
                            };
                        return {
                            message: defaultError,
                        };
                    },
                }
                : {}),
        });
    }
    strip() {
        return new ZodObject({
            ...this._def,
            unknownKeys: "strip",
        });
    }
    passthrough() {
        return new ZodObject({
            ...this._def,
            unknownKeys: "passthrough",
        });
    }
    // const AugmentFactory =
    //   <Def extends ZodObjectDef>(def: Def) =>
    //   <Augmentation extends ZodRawShape>(
    //     augmentation: Augmentation
    //   ): ZodObject<
    //     extendShape<ReturnType<Def["shape"]>, Augmentation>,
    //     Def["unknownKeys"],
    //     Def["catchall"]
    //   > => {
    //     return new ZodObject({
    //       ...def,
    //       shape: () => ({
    //         ...def.shape(),
    //         ...augmentation,
    //       }),
    //     }) as any;
    //   };
    extend(augmentation) {
        return new ZodObject({
            ...this._def,
            shape: () => ({
                ...this._def.shape(),
                ...augmentation,
            }),
        });
    }
    /**
     * Prior to zod@1.0.12 there was a bug in the
     * inferred type of merged objects. Please
     * upgrade if you are experiencing issues.
     */
    merge(merging) {
        const merged = new ZodObject({
            unknownKeys: merging._def.unknownKeys,
            catchall: merging._def.catchall,
            shape: () => ({
                ...this._def.shape(),
                ...merging._def.shape(),
            }),
            typeName: ZodFirstPartyTypeKind.ZodObject,
        });
        return merged;
    }
    // merge<
    //   Incoming extends AnyZodObject,
    //   Augmentation extends Incoming["shape"],
    //   NewOutput extends {
    //     [k in keyof Augmentation | keyof Output]: k extends keyof Augmentation
    //       ? Augmentation[k]["_output"]
    //       : k extends keyof Output
    //       ? Output[k]
    //       : never;
    //   },
    //   NewInput extends {
    //     [k in keyof Augmentation | keyof Input]: k extends keyof Augmentation
    //       ? Augmentation[k]["_input"]
    //       : k extends keyof Input
    //       ? Input[k]
    //       : never;
    //   }
    // >(
    //   merging: Incoming
    // ): ZodObject<
    //   extendShape<T, ReturnType<Incoming["_def"]["shape"]>>,
    //   Incoming["_def"]["unknownKeys"],
    //   Incoming["_def"]["catchall"],
    //   NewOutput,
    //   NewInput
    // > {
    //   const merged: any = new ZodObject({
    //     unknownKeys: merging._def.unknownKeys,
    //     catchall: merging._def.catchall,
    //     shape: () =>
    //       objectUtil.mergeShapes(this._def.shape(), merging._def.shape()),
    //     typeName: ZodFirstPartyTypeKind.ZodObject,
    //   }) as any;
    //   return merged;
    // }
    setKey(key, schema) {
        return this.augment({ [key]: schema });
    }
    // merge<Incoming extends AnyZodObject>(
    //   merging: Incoming
    // ): //ZodObject<T & Incoming["_shape"], UnknownKeys, Catchall> = (merging) => {
    // ZodObject<
    //   extendShape<T, ReturnType<Incoming["_def"]["shape"]>>,
    //   Incoming["_def"]["unknownKeys"],
    //   Incoming["_def"]["catchall"]
    // > {
    //   // const mergedShape = objectUtil.mergeShapes(
    //   //   this._def.shape(),
    //   //   merging._def.shape()
    //   // );
    //   const merged: any = new ZodObject({
    //     unknownKeys: merging._def.unknownKeys,
    //     catchall: merging._def.catchall,
    //     shape: () =>
    //       objectUtil.mergeShapes(this._def.shape(), merging._def.shape()),
    //     typeName: ZodFirstPartyTypeKind.ZodObject,
    //   }) as any;
    //   return merged;
    // }
    catchall(index) {
        return new ZodObject({
            ...this._def,
            catchall: index,
        });
    }
    pick(mask) {
        const shape = {};
        for (const key of util$1.objectKeys(mask)) {
            if (mask[key] && this.shape[key]) {
                shape[key] = this.shape[key];
            }
        }
        return new ZodObject({
            ...this._def,
            shape: () => shape,
        });
    }
    omit(mask) {
        const shape = {};
        for (const key of util$1.objectKeys(this.shape)) {
            if (!mask[key]) {
                shape[key] = this.shape[key];
            }
        }
        return new ZodObject({
            ...this._def,
            shape: () => shape,
        });
    }
    /**
     * @deprecated
     */
    deepPartial() {
        return deepPartialify(this);
    }
    partial(mask) {
        const newShape = {};
        for (const key of util$1.objectKeys(this.shape)) {
            const fieldSchema = this.shape[key];
            if (mask && !mask[key]) {
                newShape[key] = fieldSchema;
            }
            else {
                newShape[key] = fieldSchema.optional();
            }
        }
        return new ZodObject({
            ...this._def,
            shape: () => newShape,
        });
    }
    required(mask) {
        const newShape = {};
        for (const key of util$1.objectKeys(this.shape)) {
            if (mask && !mask[key]) {
                newShape[key] = this.shape[key];
            }
            else {
                const fieldSchema = this.shape[key];
                let newField = fieldSchema;
                while (newField instanceof ZodOptional) {
                    newField = newField._def.innerType;
                }
                newShape[key] = newField;
            }
        }
        return new ZodObject({
            ...this._def,
            shape: () => newShape,
        });
    }
    keyof() {
        return createZodEnum(util$1.objectKeys(this.shape));
    }
}
ZodObject.create = (shape, params) => {
    return new ZodObject({
        shape: () => shape,
        unknownKeys: "strip",
        catchall: ZodNever.create(),
        typeName: ZodFirstPartyTypeKind.ZodObject,
        ...processCreateParams(params),
    });
};
ZodObject.strictCreate = (shape, params) => {
    return new ZodObject({
        shape: () => shape,
        unknownKeys: "strict",
        catchall: ZodNever.create(),
        typeName: ZodFirstPartyTypeKind.ZodObject,
        ...processCreateParams(params),
    });
};
ZodObject.lazycreate = (shape, params) => {
    return new ZodObject({
        shape,
        unknownKeys: "strip",
        catchall: ZodNever.create(),
        typeName: ZodFirstPartyTypeKind.ZodObject,
        ...processCreateParams(params),
    });
};
class ZodUnion extends ZodType {
    _parse(input) {
        const { ctx } = this._processInputParams(input);
        const options = this._def.options;
        function handleResults(results) {
            // return first issue-free validation if it exists
            for (const result of results) {
                if (result.result.status === "valid") {
                    return result.result;
                }
            }
            for (const result of results) {
                if (result.result.status === "dirty") {
                    // add issues from dirty option
                    ctx.common.issues.push(...result.ctx.common.issues);
                    return result.result;
                }
            }
            // return invalid
            const unionErrors = results.map((result) => new ZodError(result.ctx.common.issues));
            addIssueToContext(ctx, {
                code: ZodIssueCode.invalid_union,
                unionErrors,
            });
            return INVALID;
        }
        if (ctx.common.async) {
            return Promise.all(options.map(async (option) => {
                const childCtx = {
                    ...ctx,
                    common: {
                        ...ctx.common,
                        issues: [],
                    },
                    parent: null,
                };
                return {
                    result: await option._parseAsync({
                        data: ctx.data,
                        path: ctx.path,
                        parent: childCtx,
                    }),
                    ctx: childCtx,
                };
            })).then(handleResults);
        }
        else {
            let dirty = undefined;
            const issues = [];
            for (const option of options) {
                const childCtx = {
                    ...ctx,
                    common: {
                        ...ctx.common,
                        issues: [],
                    },
                    parent: null,
                };
                const result = option._parseSync({
                    data: ctx.data,
                    path: ctx.path,
                    parent: childCtx,
                });
                if (result.status === "valid") {
                    return result;
                }
                else if (result.status === "dirty" && !dirty) {
                    dirty = { result, ctx: childCtx };
                }
                if (childCtx.common.issues.length) {
                    issues.push(childCtx.common.issues);
                }
            }
            if (dirty) {
                ctx.common.issues.push(...dirty.ctx.common.issues);
                return dirty.result;
            }
            const unionErrors = issues.map((issues) => new ZodError(issues));
            addIssueToContext(ctx, {
                code: ZodIssueCode.invalid_union,
                unionErrors,
            });
            return INVALID;
        }
    }
    get options() {
        return this._def.options;
    }
}
ZodUnion.create = (types, params) => {
    return new ZodUnion({
        options: types,
        typeName: ZodFirstPartyTypeKind.ZodUnion,
        ...processCreateParams(params),
    });
};
/////////////////////////////////////////////////////
/////////////////////////////////////////////////////
//////////                                 //////////
//////////      ZodDiscriminatedUnion      //////////
//////////                                 //////////
/////////////////////////////////////////////////////
/////////////////////////////////////////////////////
const getDiscriminator = (type) => {
    if (type instanceof ZodLazy) {
        return getDiscriminator(type.schema);
    }
    else if (type instanceof ZodEffects) {
        return getDiscriminator(type.innerType());
    }
    else if (type instanceof ZodLiteral) {
        return [type.value];
    }
    else if (type instanceof ZodEnum) {
        return type.options;
    }
    else if (type instanceof ZodNativeEnum) {
        // eslint-disable-next-line ban/ban
        return util$1.objectValues(type.enum);
    }
    else if (type instanceof ZodDefault) {
        return getDiscriminator(type._def.innerType);
    }
    else if (type instanceof ZodUndefined) {
        return [undefined];
    }
    else if (type instanceof ZodNull) {
        return [null];
    }
    else if (type instanceof ZodOptional) {
        return [undefined, ...getDiscriminator(type.unwrap())];
    }
    else if (type instanceof ZodNullable) {
        return [null, ...getDiscriminator(type.unwrap())];
    }
    else if (type instanceof ZodBranded) {
        return getDiscriminator(type.unwrap());
    }
    else if (type instanceof ZodReadonly) {
        return getDiscriminator(type.unwrap());
    }
    else if (type instanceof ZodCatch) {
        return getDiscriminator(type._def.innerType);
    }
    else {
        return [];
    }
};
class ZodDiscriminatedUnion extends ZodType {
    _parse(input) {
        const { ctx } = this._processInputParams(input);
        if (ctx.parsedType !== ZodParsedType.object) {
            addIssueToContext(ctx, {
                code: ZodIssueCode.invalid_type,
                expected: ZodParsedType.object,
                received: ctx.parsedType,
            });
            return INVALID;
        }
        const discriminator = this.discriminator;
        const discriminatorValue = ctx.data[discriminator];
        const option = this.optionsMap.get(discriminatorValue);
        if (!option) {
            addIssueToContext(ctx, {
                code: ZodIssueCode.invalid_union_discriminator,
                options: Array.from(this.optionsMap.keys()),
                path: [discriminator],
            });
            return INVALID;
        }
        if (ctx.common.async) {
            return option._parseAsync({
                data: ctx.data,
                path: ctx.path,
                parent: ctx,
            });
        }
        else {
            return option._parseSync({
                data: ctx.data,
                path: ctx.path,
                parent: ctx,
            });
        }
    }
    get discriminator() {
        return this._def.discriminator;
    }
    get options() {
        return this._def.options;
    }
    get optionsMap() {
        return this._def.optionsMap;
    }
    /**
     * The constructor of the discriminated union schema. Its behaviour is very similar to that of the normal z.union() constructor.
     * However, it only allows a union of objects, all of which need to share a discriminator property. This property must
     * have a different value for each object in the union.
     * @param discriminator the name of the discriminator property
     * @param types an array of object schemas
     * @param params
     */
    static create(discriminator, options, params) {
        // Get all the valid discriminator values
        const optionsMap = new Map();
        // try {
        for (const type of options) {
            const discriminatorValues = getDiscriminator(type.shape[discriminator]);
            if (!discriminatorValues.length) {
                throw new Error(`A discriminator value for key \`${discriminator}\` could not be extracted from all schema options`);
            }
            for (const value of discriminatorValues) {
                if (optionsMap.has(value)) {
                    throw new Error(`Discriminator property ${String(discriminator)} has duplicate value ${String(value)}`);
                }
                optionsMap.set(value, type);
            }
        }
        return new ZodDiscriminatedUnion({
            typeName: ZodFirstPartyTypeKind.ZodDiscriminatedUnion,
            discriminator,
            options,
            optionsMap,
            ...processCreateParams(params),
        });
    }
}
function mergeValues(a, b) {
    const aType = getParsedType(a);
    const bType = getParsedType(b);
    if (a === b) {
        return { valid: true, data: a };
    }
    else if (aType === ZodParsedType.object && bType === ZodParsedType.object) {
        const bKeys = util$1.objectKeys(b);
        const sharedKeys = util$1.objectKeys(a).filter((key) => bKeys.indexOf(key) !== -1);
        const newObj = { ...a, ...b };
        for (const key of sharedKeys) {
            const sharedValue = mergeValues(a[key], b[key]);
            if (!sharedValue.valid) {
                return { valid: false };
            }
            newObj[key] = sharedValue.data;
        }
        return { valid: true, data: newObj };
    }
    else if (aType === ZodParsedType.array && bType === ZodParsedType.array) {
        if (a.length !== b.length) {
            return { valid: false };
        }
        const newArray = [];
        for (let index = 0; index < a.length; index++) {
            const itemA = a[index];
            const itemB = b[index];
            const sharedValue = mergeValues(itemA, itemB);
            if (!sharedValue.valid) {
                return { valid: false };
            }
            newArray.push(sharedValue.data);
        }
        return { valid: true, data: newArray };
    }
    else if (aType === ZodParsedType.date && bType === ZodParsedType.date && +a === +b) {
        return { valid: true, data: a };
    }
    else {
        return { valid: false };
    }
}
class ZodIntersection extends ZodType {
    _parse(input) {
        const { status, ctx } = this._processInputParams(input);
        const handleParsed = (parsedLeft, parsedRight) => {
            if (isAborted(parsedLeft) || isAborted(parsedRight)) {
                return INVALID;
            }
            const merged = mergeValues(parsedLeft.value, parsedRight.value);
            if (!merged.valid) {
                addIssueToContext(ctx, {
                    code: ZodIssueCode.invalid_intersection_types,
                });
                return INVALID;
            }
            if (isDirty(parsedLeft) || isDirty(parsedRight)) {
                status.dirty();
            }
            return { status: status.value, value: merged.data };
        };
        if (ctx.common.async) {
            return Promise.all([
                this._def.left._parseAsync({
                    data: ctx.data,
                    path: ctx.path,
                    parent: ctx,
                }),
                this._def.right._parseAsync({
                    data: ctx.data,
                    path: ctx.path,
                    parent: ctx,
                }),
            ]).then(([left, right]) => handleParsed(left, right));
        }
        else {
            return handleParsed(this._def.left._parseSync({
                data: ctx.data,
                path: ctx.path,
                parent: ctx,
            }), this._def.right._parseSync({
                data: ctx.data,
                path: ctx.path,
                parent: ctx,
            }));
        }
    }
}
ZodIntersection.create = (left, right, params) => {
    return new ZodIntersection({
        left: left,
        right: right,
        typeName: ZodFirstPartyTypeKind.ZodIntersection,
        ...processCreateParams(params),
    });
};
// type ZodTupleItems = [ZodTypeAny, ...ZodTypeAny[]];
class ZodTuple extends ZodType {
    _parse(input) {
        const { status, ctx } = this._processInputParams(input);
        if (ctx.parsedType !== ZodParsedType.array) {
            addIssueToContext(ctx, {
                code: ZodIssueCode.invalid_type,
                expected: ZodParsedType.array,
                received: ctx.parsedType,
            });
            return INVALID;
        }
        if (ctx.data.length < this._def.items.length) {
            addIssueToContext(ctx, {
                code: ZodIssueCode.too_small,
                minimum: this._def.items.length,
                inclusive: true,
                exact: false,
                type: "array",
            });
            return INVALID;
        }
        const rest = this._def.rest;
        if (!rest && ctx.data.length > this._def.items.length) {
            addIssueToContext(ctx, {
                code: ZodIssueCode.too_big,
                maximum: this._def.items.length,
                inclusive: true,
                exact: false,
                type: "array",
            });
            status.dirty();
        }
        const items = [...ctx.data]
            .map((item, itemIndex) => {
            const schema = this._def.items[itemIndex] || this._def.rest;
            if (!schema)
                return null;
            return schema._parse(new ParseInputLazyPath(ctx, item, ctx.path, itemIndex));
        })
            .filter((x) => !!x); // filter nulls
        if (ctx.common.async) {
            return Promise.all(items).then((results) => {
                return ParseStatus.mergeArray(status, results);
            });
        }
        else {
            return ParseStatus.mergeArray(status, items);
        }
    }
    get items() {
        return this._def.items;
    }
    rest(rest) {
        return new ZodTuple({
            ...this._def,
            rest,
        });
    }
}
ZodTuple.create = (schemas, params) => {
    if (!Array.isArray(schemas)) {
        throw new Error("You must pass an array of schemas to z.tuple([ ... ])");
    }
    return new ZodTuple({
        items: schemas,
        typeName: ZodFirstPartyTypeKind.ZodTuple,
        rest: null,
        ...processCreateParams(params),
    });
};
class ZodRecord extends ZodType {
    get keySchema() {
        return this._def.keyType;
    }
    get valueSchema() {
        return this._def.valueType;
    }
    _parse(input) {
        const { status, ctx } = this._processInputParams(input);
        if (ctx.parsedType !== ZodParsedType.object) {
            addIssueToContext(ctx, {
                code: ZodIssueCode.invalid_type,
                expected: ZodParsedType.object,
                received: ctx.parsedType,
            });
            return INVALID;
        }
        const pairs = [];
        const keyType = this._def.keyType;
        const valueType = this._def.valueType;
        for (const key in ctx.data) {
            pairs.push({
                key: keyType._parse(new ParseInputLazyPath(ctx, key, ctx.path, key)),
                value: valueType._parse(new ParseInputLazyPath(ctx, ctx.data[key], ctx.path, key)),
                alwaysSet: key in ctx.data,
            });
        }
        if (ctx.common.async) {
            return ParseStatus.mergeObjectAsync(status, pairs);
        }
        else {
            return ParseStatus.mergeObjectSync(status, pairs);
        }
    }
    get element() {
        return this._def.valueType;
    }
    static create(first, second, third) {
        if (second instanceof ZodType) {
            return new ZodRecord({
                keyType: first,
                valueType: second,
                typeName: ZodFirstPartyTypeKind.ZodRecord,
                ...processCreateParams(third),
            });
        }
        return new ZodRecord({
            keyType: ZodString.create(),
            valueType: first,
            typeName: ZodFirstPartyTypeKind.ZodRecord,
            ...processCreateParams(second),
        });
    }
}
class ZodMap extends ZodType {
    get keySchema() {
        return this._def.keyType;
    }
    get valueSchema() {
        return this._def.valueType;
    }
    _parse(input) {
        const { status, ctx } = this._processInputParams(input);
        if (ctx.parsedType !== ZodParsedType.map) {
            addIssueToContext(ctx, {
                code: ZodIssueCode.invalid_type,
                expected: ZodParsedType.map,
                received: ctx.parsedType,
            });
            return INVALID;
        }
        const keyType = this._def.keyType;
        const valueType = this._def.valueType;
        const pairs = [...ctx.data.entries()].map(([key, value], index) => {
            return {
                key: keyType._parse(new ParseInputLazyPath(ctx, key, ctx.path, [index, "key"])),
                value: valueType._parse(new ParseInputLazyPath(ctx, value, ctx.path, [index, "value"])),
            };
        });
        if (ctx.common.async) {
            const finalMap = new Map();
            return Promise.resolve().then(async () => {
                for (const pair of pairs) {
                    const key = await pair.key;
                    const value = await pair.value;
                    if (key.status === "aborted" || value.status === "aborted") {
                        return INVALID;
                    }
                    if (key.status === "dirty" || value.status === "dirty") {
                        status.dirty();
                    }
                    finalMap.set(key.value, value.value);
                }
                return { status: status.value, value: finalMap };
            });
        }
        else {
            const finalMap = new Map();
            for (const pair of pairs) {
                const key = pair.key;
                const value = pair.value;
                if (key.status === "aborted" || value.status === "aborted") {
                    return INVALID;
                }
                if (key.status === "dirty" || value.status === "dirty") {
                    status.dirty();
                }
                finalMap.set(key.value, value.value);
            }
            return { status: status.value, value: finalMap };
        }
    }
}
ZodMap.create = (keyType, valueType, params) => {
    return new ZodMap({
        valueType,
        keyType,
        typeName: ZodFirstPartyTypeKind.ZodMap,
        ...processCreateParams(params),
    });
};
class ZodSet extends ZodType {
    _parse(input) {
        const { status, ctx } = this._processInputParams(input);
        if (ctx.parsedType !== ZodParsedType.set) {
            addIssueToContext(ctx, {
                code: ZodIssueCode.invalid_type,
                expected: ZodParsedType.set,
                received: ctx.parsedType,
            });
            return INVALID;
        }
        const def = this._def;
        if (def.minSize !== null) {
            if (ctx.data.size < def.minSize.value) {
                addIssueToContext(ctx, {
                    code: ZodIssueCode.too_small,
                    minimum: def.minSize.value,
                    type: "set",
                    inclusive: true,
                    exact: false,
                    message: def.minSize.message,
                });
                status.dirty();
            }
        }
        if (def.maxSize !== null) {
            if (ctx.data.size > def.maxSize.value) {
                addIssueToContext(ctx, {
                    code: ZodIssueCode.too_big,
                    maximum: def.maxSize.value,
                    type: "set",
                    inclusive: true,
                    exact: false,
                    message: def.maxSize.message,
                });
                status.dirty();
            }
        }
        const valueType = this._def.valueType;
        function finalizeSet(elements) {
            const parsedSet = new Set();
            for (const element of elements) {
                if (element.status === "aborted")
                    return INVALID;
                if (element.status === "dirty")
                    status.dirty();
                parsedSet.add(element.value);
            }
            return { status: status.value, value: parsedSet };
        }
        const elements = [...ctx.data.values()].map((item, i) => valueType._parse(new ParseInputLazyPath(ctx, item, ctx.path, i)));
        if (ctx.common.async) {
            return Promise.all(elements).then((elements) => finalizeSet(elements));
        }
        else {
            return finalizeSet(elements);
        }
    }
    min(minSize, message) {
        return new ZodSet({
            ...this._def,
            minSize: { value: minSize, message: errorUtil.toString(message) },
        });
    }
    max(maxSize, message) {
        return new ZodSet({
            ...this._def,
            maxSize: { value: maxSize, message: errorUtil.toString(message) },
        });
    }
    size(size, message) {
        return this.min(size, message).max(size, message);
    }
    nonempty(message) {
        return this.min(1, message);
    }
}
ZodSet.create = (valueType, params) => {
    return new ZodSet({
        valueType,
        minSize: null,
        maxSize: null,
        typeName: ZodFirstPartyTypeKind.ZodSet,
        ...processCreateParams(params),
    });
};
class ZodLazy extends ZodType {
    get schema() {
        return this._def.getter();
    }
    _parse(input) {
        const { ctx } = this._processInputParams(input);
        const lazySchema = this._def.getter();
        return lazySchema._parse({ data: ctx.data, path: ctx.path, parent: ctx });
    }
}
ZodLazy.create = (getter, params) => {
    return new ZodLazy({
        getter: getter,
        typeName: ZodFirstPartyTypeKind.ZodLazy,
        ...processCreateParams(params),
    });
};
class ZodLiteral extends ZodType {
    _parse(input) {
        if (input.data !== this._def.value) {
            const ctx = this._getOrReturnCtx(input);
            addIssueToContext(ctx, {
                received: ctx.data,
                code: ZodIssueCode.invalid_literal,
                expected: this._def.value,
            });
            return INVALID;
        }
        return { status: "valid", value: input.data };
    }
    get value() {
        return this._def.value;
    }
}
ZodLiteral.create = (value, params) => {
    return new ZodLiteral({
        value: value,
        typeName: ZodFirstPartyTypeKind.ZodLiteral,
        ...processCreateParams(params),
    });
};
function createZodEnum(values, params) {
    return new ZodEnum({
        values,
        typeName: ZodFirstPartyTypeKind.ZodEnum,
        ...processCreateParams(params),
    });
}
class ZodEnum extends ZodType {
    _parse(input) {
        if (typeof input.data !== "string") {
            const ctx = this._getOrReturnCtx(input);
            const expectedValues = this._def.values;
            addIssueToContext(ctx, {
                expected: util$1.joinValues(expectedValues),
                received: ctx.parsedType,
                code: ZodIssueCode.invalid_type,
            });
            return INVALID;
        }
        if (!this._cache) {
            this._cache = new Set(this._def.values);
        }
        if (!this._cache.has(input.data)) {
            const ctx = this._getOrReturnCtx(input);
            const expectedValues = this._def.values;
            addIssueToContext(ctx, {
                received: ctx.data,
                code: ZodIssueCode.invalid_enum_value,
                options: expectedValues,
            });
            return INVALID;
        }
        return OK(input.data);
    }
    get options() {
        return this._def.values;
    }
    get enum() {
        const enumValues = {};
        for (const val of this._def.values) {
            enumValues[val] = val;
        }
        return enumValues;
    }
    get Values() {
        const enumValues = {};
        for (const val of this._def.values) {
            enumValues[val] = val;
        }
        return enumValues;
    }
    get Enum() {
        const enumValues = {};
        for (const val of this._def.values) {
            enumValues[val] = val;
        }
        return enumValues;
    }
    extract(values, newDef = this._def) {
        return ZodEnum.create(values, {
            ...this._def,
            ...newDef,
        });
    }
    exclude(values, newDef = this._def) {
        return ZodEnum.create(this.options.filter((opt) => !values.includes(opt)), {
            ...this._def,
            ...newDef,
        });
    }
}
ZodEnum.create = createZodEnum;
class ZodNativeEnum extends ZodType {
    _parse(input) {
        const nativeEnumValues = util$1.getValidEnumValues(this._def.values);
        const ctx = this._getOrReturnCtx(input);
        if (ctx.parsedType !== ZodParsedType.string && ctx.parsedType !== ZodParsedType.number) {
            const expectedValues = util$1.objectValues(nativeEnumValues);
            addIssueToContext(ctx, {
                expected: util$1.joinValues(expectedValues),
                received: ctx.parsedType,
                code: ZodIssueCode.invalid_type,
            });
            return INVALID;
        }
        if (!this._cache) {
            this._cache = new Set(util$1.getValidEnumValues(this._def.values));
        }
        if (!this._cache.has(input.data)) {
            const expectedValues = util$1.objectValues(nativeEnumValues);
            addIssueToContext(ctx, {
                received: ctx.data,
                code: ZodIssueCode.invalid_enum_value,
                options: expectedValues,
            });
            return INVALID;
        }
        return OK(input.data);
    }
    get enum() {
        return this._def.values;
    }
}
ZodNativeEnum.create = (values, params) => {
    return new ZodNativeEnum({
        values: values,
        typeName: ZodFirstPartyTypeKind.ZodNativeEnum,
        ...processCreateParams(params),
    });
};
class ZodPromise extends ZodType {
    unwrap() {
        return this._def.type;
    }
    _parse(input) {
        const { ctx } = this._processInputParams(input);
        if (ctx.parsedType !== ZodParsedType.promise && ctx.common.async === false) {
            addIssueToContext(ctx, {
                code: ZodIssueCode.invalid_type,
                expected: ZodParsedType.promise,
                received: ctx.parsedType,
            });
            return INVALID;
        }
        const promisified = ctx.parsedType === ZodParsedType.promise ? ctx.data : Promise.resolve(ctx.data);
        return OK(promisified.then((data) => {
            return this._def.type.parseAsync(data, {
                path: ctx.path,
                errorMap: ctx.common.contextualErrorMap,
            });
        }));
    }
}
ZodPromise.create = (schema, params) => {
    return new ZodPromise({
        type: schema,
        typeName: ZodFirstPartyTypeKind.ZodPromise,
        ...processCreateParams(params),
    });
};
class ZodEffects extends ZodType {
    innerType() {
        return this._def.schema;
    }
    sourceType() {
        return this._def.schema._def.typeName === ZodFirstPartyTypeKind.ZodEffects
            ? this._def.schema.sourceType()
            : this._def.schema;
    }
    _parse(input) {
        const { status, ctx } = this._processInputParams(input);
        const effect = this._def.effect || null;
        const checkCtx = {
            addIssue: (arg) => {
                addIssueToContext(ctx, arg);
                if (arg.fatal) {
                    status.abort();
                }
                else {
                    status.dirty();
                }
            },
            get path() {
                return ctx.path;
            },
        };
        checkCtx.addIssue = checkCtx.addIssue.bind(checkCtx);
        if (effect.type === "preprocess") {
            const processed = effect.transform(ctx.data, checkCtx);
            if (ctx.common.async) {
                return Promise.resolve(processed).then(async (processed) => {
                    if (status.value === "aborted")
                        return INVALID;
                    const result = await this._def.schema._parseAsync({
                        data: processed,
                        path: ctx.path,
                        parent: ctx,
                    });
                    if (result.status === "aborted")
                        return INVALID;
                    if (result.status === "dirty")
                        return DIRTY(result.value);
                    if (status.value === "dirty")
                        return DIRTY(result.value);
                    return result;
                });
            }
            else {
                if (status.value === "aborted")
                    return INVALID;
                const result = this._def.schema._parseSync({
                    data: processed,
                    path: ctx.path,
                    parent: ctx,
                });
                if (result.status === "aborted")
                    return INVALID;
                if (result.status === "dirty")
                    return DIRTY(result.value);
                if (status.value === "dirty")
                    return DIRTY(result.value);
                return result;
            }
        }
        if (effect.type === "refinement") {
            const executeRefinement = (acc) => {
                const result = effect.refinement(acc, checkCtx);
                if (ctx.common.async) {
                    return Promise.resolve(result);
                }
                if (result instanceof Promise) {
                    throw new Error("Async refinement encountered during synchronous parse operation. Use .parseAsync instead.");
                }
                return acc;
            };
            if (ctx.common.async === false) {
                const inner = this._def.schema._parseSync({
                    data: ctx.data,
                    path: ctx.path,
                    parent: ctx,
                });
                if (inner.status === "aborted")
                    return INVALID;
                if (inner.status === "dirty")
                    status.dirty();
                // return value is ignored
                executeRefinement(inner.value);
                return { status: status.value, value: inner.value };
            }
            else {
                return this._def.schema._parseAsync({ data: ctx.data, path: ctx.path, parent: ctx }).then((inner) => {
                    if (inner.status === "aborted")
                        return INVALID;
                    if (inner.status === "dirty")
                        status.dirty();
                    return executeRefinement(inner.value).then(() => {
                        return { status: status.value, value: inner.value };
                    });
                });
            }
        }
        if (effect.type === "transform") {
            if (ctx.common.async === false) {
                const base = this._def.schema._parseSync({
                    data: ctx.data,
                    path: ctx.path,
                    parent: ctx,
                });
                if (!isValid(base))
                    return INVALID;
                const result = effect.transform(base.value, checkCtx);
                if (result instanceof Promise) {
                    throw new Error(`Asynchronous transform encountered during synchronous parse operation. Use .parseAsync instead.`);
                }
                return { status: status.value, value: result };
            }
            else {
                return this._def.schema._parseAsync({ data: ctx.data, path: ctx.path, parent: ctx }).then((base) => {
                    if (!isValid(base))
                        return INVALID;
                    return Promise.resolve(effect.transform(base.value, checkCtx)).then((result) => ({
                        status: status.value,
                        value: result,
                    }));
                });
            }
        }
        util$1.assertNever(effect);
    }
}
ZodEffects.create = (schema, effect, params) => {
    return new ZodEffects({
        schema,
        typeName: ZodFirstPartyTypeKind.ZodEffects,
        effect,
        ...processCreateParams(params),
    });
};
ZodEffects.createWithPreprocess = (preprocess, schema, params) => {
    return new ZodEffects({
        schema,
        effect: { type: "preprocess", transform: preprocess },
        typeName: ZodFirstPartyTypeKind.ZodEffects,
        ...processCreateParams(params),
    });
};
class ZodOptional extends ZodType {
    _parse(input) {
        const parsedType = this._getType(input);
        if (parsedType === ZodParsedType.undefined) {
            return OK(undefined);
        }
        return this._def.innerType._parse(input);
    }
    unwrap() {
        return this._def.innerType;
    }
}
ZodOptional.create = (type, params) => {
    return new ZodOptional({
        innerType: type,
        typeName: ZodFirstPartyTypeKind.ZodOptional,
        ...processCreateParams(params),
    });
};
class ZodNullable extends ZodType {
    _parse(input) {
        const parsedType = this._getType(input);
        if (parsedType === ZodParsedType.null) {
            return OK(null);
        }
        return this._def.innerType._parse(input);
    }
    unwrap() {
        return this._def.innerType;
    }
}
ZodNullable.create = (type, params) => {
    return new ZodNullable({
        innerType: type,
        typeName: ZodFirstPartyTypeKind.ZodNullable,
        ...processCreateParams(params),
    });
};
class ZodDefault extends ZodType {
    _parse(input) {
        const { ctx } = this._processInputParams(input);
        let data = ctx.data;
        if (ctx.parsedType === ZodParsedType.undefined) {
            data = this._def.defaultValue();
        }
        return this._def.innerType._parse({
            data,
            path: ctx.path,
            parent: ctx,
        });
    }
    removeDefault() {
        return this._def.innerType;
    }
}
ZodDefault.create = (type, params) => {
    return new ZodDefault({
        innerType: type,
        typeName: ZodFirstPartyTypeKind.ZodDefault,
        defaultValue: typeof params.default === "function" ? params.default : () => params.default,
        ...processCreateParams(params),
    });
};
class ZodCatch extends ZodType {
    _parse(input) {
        const { ctx } = this._processInputParams(input);
        // newCtx is used to not collect issues from inner types in ctx
        const newCtx = {
            ...ctx,
            common: {
                ...ctx.common,
                issues: [],
            },
        };
        const result = this._def.innerType._parse({
            data: newCtx.data,
            path: newCtx.path,
            parent: {
                ...newCtx,
            },
        });
        if (isAsync(result)) {
            return result.then((result) => {
                return {
                    status: "valid",
                    value: result.status === "valid"
                        ? result.value
                        : this._def.catchValue({
                            get error() {
                                return new ZodError(newCtx.common.issues);
                            },
                            input: newCtx.data,
                        }),
                };
            });
        }
        else {
            return {
                status: "valid",
                value: result.status === "valid"
                    ? result.value
                    : this._def.catchValue({
                        get error() {
                            return new ZodError(newCtx.common.issues);
                        },
                        input: newCtx.data,
                    }),
            };
        }
    }
    removeCatch() {
        return this._def.innerType;
    }
}
ZodCatch.create = (type, params) => {
    return new ZodCatch({
        innerType: type,
        typeName: ZodFirstPartyTypeKind.ZodCatch,
        catchValue: typeof params.catch === "function" ? params.catch : () => params.catch,
        ...processCreateParams(params),
    });
};
class ZodNaN extends ZodType {
    _parse(input) {
        const parsedType = this._getType(input);
        if (parsedType !== ZodParsedType.nan) {
            const ctx = this._getOrReturnCtx(input);
            addIssueToContext(ctx, {
                code: ZodIssueCode.invalid_type,
                expected: ZodParsedType.nan,
                received: ctx.parsedType,
            });
            return INVALID;
        }
        return { status: "valid", value: input.data };
    }
}
ZodNaN.create = (params) => {
    return new ZodNaN({
        typeName: ZodFirstPartyTypeKind.ZodNaN,
        ...processCreateParams(params),
    });
};
class ZodBranded extends ZodType {
    _parse(input) {
        const { ctx } = this._processInputParams(input);
        const data = ctx.data;
        return this._def.type._parse({
            data,
            path: ctx.path,
            parent: ctx,
        });
    }
    unwrap() {
        return this._def.type;
    }
}
class ZodPipeline extends ZodType {
    _parse(input) {
        const { status, ctx } = this._processInputParams(input);
        if (ctx.common.async) {
            const handleAsync = async () => {
                const inResult = await this._def.in._parseAsync({
                    data: ctx.data,
                    path: ctx.path,
                    parent: ctx,
                });
                if (inResult.status === "aborted")
                    return INVALID;
                if (inResult.status === "dirty") {
                    status.dirty();
                    return DIRTY(inResult.value);
                }
                else {
                    return this._def.out._parseAsync({
                        data: inResult.value,
                        path: ctx.path,
                        parent: ctx,
                    });
                }
            };
            return handleAsync();
        }
        else {
            const inResult = this._def.in._parseSync({
                data: ctx.data,
                path: ctx.path,
                parent: ctx,
            });
            if (inResult.status === "aborted")
                return INVALID;
            if (inResult.status === "dirty") {
                status.dirty();
                return {
                    status: "dirty",
                    value: inResult.value,
                };
            }
            else {
                return this._def.out._parseSync({
                    data: inResult.value,
                    path: ctx.path,
                    parent: ctx,
                });
            }
        }
    }
    static create(a, b) {
        return new ZodPipeline({
            in: a,
            out: b,
            typeName: ZodFirstPartyTypeKind.ZodPipeline,
        });
    }
}
class ZodReadonly extends ZodType {
    _parse(input) {
        const result = this._def.innerType._parse(input);
        const freeze = (data) => {
            if (isValid(data)) {
                data.value = Object.freeze(data.value);
            }
            return data;
        };
        return isAsync(result) ? result.then((data) => freeze(data)) : freeze(result);
    }
    unwrap() {
        return this._def.innerType;
    }
}
ZodReadonly.create = (type, params) => {
    return new ZodReadonly({
        innerType: type,
        typeName: ZodFirstPartyTypeKind.ZodReadonly,
        ...processCreateParams(params),
    });
};
var ZodFirstPartyTypeKind;
(function (ZodFirstPartyTypeKind) {
    ZodFirstPartyTypeKind["ZodString"] = "ZodString";
    ZodFirstPartyTypeKind["ZodNumber"] = "ZodNumber";
    ZodFirstPartyTypeKind["ZodNaN"] = "ZodNaN";
    ZodFirstPartyTypeKind["ZodBigInt"] = "ZodBigInt";
    ZodFirstPartyTypeKind["ZodBoolean"] = "ZodBoolean";
    ZodFirstPartyTypeKind["ZodDate"] = "ZodDate";
    ZodFirstPartyTypeKind["ZodSymbol"] = "ZodSymbol";
    ZodFirstPartyTypeKind["ZodUndefined"] = "ZodUndefined";
    ZodFirstPartyTypeKind["ZodNull"] = "ZodNull";
    ZodFirstPartyTypeKind["ZodAny"] = "ZodAny";
    ZodFirstPartyTypeKind["ZodUnknown"] = "ZodUnknown";
    ZodFirstPartyTypeKind["ZodNever"] = "ZodNever";
    ZodFirstPartyTypeKind["ZodVoid"] = "ZodVoid";
    ZodFirstPartyTypeKind["ZodArray"] = "ZodArray";
    ZodFirstPartyTypeKind["ZodObject"] = "ZodObject";
    ZodFirstPartyTypeKind["ZodUnion"] = "ZodUnion";
    ZodFirstPartyTypeKind["ZodDiscriminatedUnion"] = "ZodDiscriminatedUnion";
    ZodFirstPartyTypeKind["ZodIntersection"] = "ZodIntersection";
    ZodFirstPartyTypeKind["ZodTuple"] = "ZodTuple";
    ZodFirstPartyTypeKind["ZodRecord"] = "ZodRecord";
    ZodFirstPartyTypeKind["ZodMap"] = "ZodMap";
    ZodFirstPartyTypeKind["ZodSet"] = "ZodSet";
    ZodFirstPartyTypeKind["ZodFunction"] = "ZodFunction";
    ZodFirstPartyTypeKind["ZodLazy"] = "ZodLazy";
    ZodFirstPartyTypeKind["ZodLiteral"] = "ZodLiteral";
    ZodFirstPartyTypeKind["ZodEnum"] = "ZodEnum";
    ZodFirstPartyTypeKind["ZodEffects"] = "ZodEffects";
    ZodFirstPartyTypeKind["ZodNativeEnum"] = "ZodNativeEnum";
    ZodFirstPartyTypeKind["ZodOptional"] = "ZodOptional";
    ZodFirstPartyTypeKind["ZodNullable"] = "ZodNullable";
    ZodFirstPartyTypeKind["ZodDefault"] = "ZodDefault";
    ZodFirstPartyTypeKind["ZodCatch"] = "ZodCatch";
    ZodFirstPartyTypeKind["ZodPromise"] = "ZodPromise";
    ZodFirstPartyTypeKind["ZodBranded"] = "ZodBranded";
    ZodFirstPartyTypeKind["ZodPipeline"] = "ZodPipeline";
    ZodFirstPartyTypeKind["ZodReadonly"] = "ZodReadonly";
})(ZodFirstPartyTypeKind || (ZodFirstPartyTypeKind = {}));
const stringType = ZodString.create;
const numberType = ZodNumber.create;
const booleanType = ZodBoolean.create;
const anyType = ZodAny.create;
const unknownType = ZodUnknown.create;
ZodNever.create;
const arrayType = ZodArray.create;
const objectType = ZodObject.create;
const unionType = ZodUnion.create;
const discriminatedUnionType = ZodDiscriminatedUnion.create;
ZodIntersection.create;
ZodTuple.create;
const recordType = ZodRecord.create;
const literalType = ZodLiteral.create;
const enumType = ZodEnum.create;
ZodPromise.create;
const optionalType = ZodOptional.create;
ZodNullable.create;

const LATEST_PROTOCOL_VERSION = "2025-06-18";
const SUPPORTED_PROTOCOL_VERSIONS = [
    LATEST_PROTOCOL_VERSION,
    "2025-03-26",
    "2024-11-05",
    "2024-10-07",
];
/* JSON-RPC types */
const JSONRPC_VERSION = "2.0";
/**
 * A progress token, used to associate progress notifications with the original request.
 */
const ProgressTokenSchema = unionType([stringType(), numberType().int()]);
/**
 * An opaque token used to represent a cursor for pagination.
 */
const CursorSchema = stringType();
const RequestMetaSchema = objectType({
    /**
     * If specified, the caller is requesting out-of-band progress notifications for this request (as represented by notifications/progress). The value of this parameter is an opaque token that will be attached to any subsequent notifications. The receiver is not obligated to provide these notifications.
     */
    progressToken: optionalType(ProgressTokenSchema),
})
    .passthrough();
const BaseRequestParamsSchema = objectType({
    _meta: optionalType(RequestMetaSchema),
})
    .passthrough();
const RequestSchema = objectType({
    method: stringType(),
    params: optionalType(BaseRequestParamsSchema),
});
const BaseNotificationParamsSchema = objectType({
    /**
     * See [MCP specification](https://github.com/modelcontextprotocol/modelcontextprotocol/blob/47339c03c143bb4ec01a26e721a1b8fe66634ebe/docs/specification/draft/basic/index.mdx#general-fields)
     * for notes on _meta usage.
     */
    _meta: optionalType(objectType({}).passthrough()),
})
    .passthrough();
const NotificationSchema = objectType({
    method: stringType(),
    params: optionalType(BaseNotificationParamsSchema),
});
const ResultSchema = objectType({
    /**
     * See [MCP specification](https://github.com/modelcontextprotocol/modelcontextprotocol/blob/47339c03c143bb4ec01a26e721a1b8fe66634ebe/docs/specification/draft/basic/index.mdx#general-fields)
     * for notes on _meta usage.
     */
    _meta: optionalType(objectType({}).passthrough()),
})
    .passthrough();
/**
 * A uniquely identifying ID for a request in JSON-RPC.
 */
const RequestIdSchema = unionType([stringType(), numberType().int()]);
/**
 * A request that expects a response.
 */
const JSONRPCRequestSchema = objectType({
    jsonrpc: literalType(JSONRPC_VERSION),
    id: RequestIdSchema,
})
    .merge(RequestSchema)
    .strict();
const isJSONRPCRequest = (value) => JSONRPCRequestSchema.safeParse(value).success;
/**
 * A notification which does not expect a response.
 */
const JSONRPCNotificationSchema = objectType({
    jsonrpc: literalType(JSONRPC_VERSION),
})
    .merge(NotificationSchema)
    .strict();
const isJSONRPCNotification = (value) => JSONRPCNotificationSchema.safeParse(value).success;
/**
 * A successful (non-error) response to a request.
 */
const JSONRPCResponseSchema = objectType({
    jsonrpc: literalType(JSONRPC_VERSION),
    id: RequestIdSchema,
    result: ResultSchema,
})
    .strict();
const isJSONRPCResponse = (value) => JSONRPCResponseSchema.safeParse(value).success;
/**
 * Error codes defined by the JSON-RPC specification.
 */
var ErrorCode;
(function (ErrorCode) {
    // SDK error codes
    ErrorCode[ErrorCode["ConnectionClosed"] = -32e3] = "ConnectionClosed";
    ErrorCode[ErrorCode["RequestTimeout"] = -32001] = "RequestTimeout";
    // Standard JSON-RPC error codes
    ErrorCode[ErrorCode["ParseError"] = -32700] = "ParseError";
    ErrorCode[ErrorCode["InvalidRequest"] = -32600] = "InvalidRequest";
    ErrorCode[ErrorCode["MethodNotFound"] = -32601] = "MethodNotFound";
    ErrorCode[ErrorCode["InvalidParams"] = -32602] = "InvalidParams";
    ErrorCode[ErrorCode["InternalError"] = -32603] = "InternalError";
})(ErrorCode || (ErrorCode = {}));
/**
 * A response to a request that indicates an error occurred.
 */
const JSONRPCErrorSchema = objectType({
    jsonrpc: literalType(JSONRPC_VERSION),
    id: RequestIdSchema,
    error: objectType({
        /**
         * The error type that occurred.
         */
        code: numberType().int(),
        /**
         * A short description of the error. The message SHOULD be limited to a concise single sentence.
         */
        message: stringType(),
        /**
         * Additional information about the error. The value of this member is defined by the sender (e.g. detailed error information, nested errors etc.).
         */
        data: optionalType(unknownType()),
    }),
})
    .strict();
const isJSONRPCError = (value) => JSONRPCErrorSchema.safeParse(value).success;
const JSONRPCMessageSchema = unionType([
    JSONRPCRequestSchema,
    JSONRPCNotificationSchema,
    JSONRPCResponseSchema,
    JSONRPCErrorSchema,
]);
/* Empty result */
/**
 * A response that indicates success but carries no data.
 */
const EmptyResultSchema = ResultSchema.strict();
/* Cancellation */
/**
 * This notification can be sent by either side to indicate that it is cancelling a previously-issued request.
 *
 * The request SHOULD still be in-flight, but due to communication latency, it is always possible that this notification MAY arrive after the request has already finished.
 *
 * This notification indicates that the result will be unused, so any associated processing SHOULD cease.
 *
 * A client MUST NOT attempt to cancel its `initialize` request.
 */
const CancelledNotificationSchema = NotificationSchema.extend({
    method: literalType("notifications/cancelled"),
    params: BaseNotificationParamsSchema.extend({
        /**
         * The ID of the request to cancel.
         *
         * This MUST correspond to the ID of a request previously issued in the same direction.
         */
        requestId: RequestIdSchema,
        /**
         * An optional string describing the reason for the cancellation. This MAY be logged or presented to the user.
         */
        reason: stringType().optional(),
    }),
});
/* Base Metadata */
/**
 * Base metadata interface for common properties across resources, tools, prompts, and implementations.
 */
const BaseMetadataSchema = objectType({
    /** Intended for programmatic or logical use, but used as a display name in past specs or fallback */
    name: stringType(),
    /**
    * Intended for UI and end-user contexts — optimized to be human-readable and easily understood,
    * even by those unfamiliar with domain-specific terminology.
    *
    * If not provided, the name should be used for display (except for Tool,
    * where `annotations.title` should be given precedence over using `name`,
    * if present).
    */
    title: optionalType(stringType()),
})
    .passthrough();
/* Initialization */
/**
 * Describes the name and version of an MCP implementation.
 */
const ImplementationSchema = BaseMetadataSchema.extend({
    version: stringType(),
});
/**
 * Capabilities a client may support. Known capabilities are defined here, in this schema, but this is not a closed set: any client can define its own, additional capabilities.
 */
const ClientCapabilitiesSchema = objectType({
    /**
     * Experimental, non-standard capabilities that the client supports.
     */
    experimental: optionalType(objectType({}).passthrough()),
    /**
     * Present if the client supports sampling from an LLM.
     */
    sampling: optionalType(objectType({}).passthrough()),
    /**
     * Present if the client supports eliciting user input.
     */
    elicitation: optionalType(objectType({}).passthrough()),
    /**
     * Present if the client supports listing roots.
     */
    roots: optionalType(objectType({
        /**
         * Whether the client supports issuing notifications for changes to the roots list.
         */
        listChanged: optionalType(booleanType()),
    })
        .passthrough()),
})
    .passthrough();
/**
 * This request is sent from the client to the server when it first connects, asking it to begin initialization.
 */
const InitializeRequestSchema = RequestSchema.extend({
    method: literalType("initialize"),
    params: BaseRequestParamsSchema.extend({
        /**
         * The latest version of the Model Context Protocol that the client supports. The client MAY decide to support older versions as well.
         */
        protocolVersion: stringType(),
        capabilities: ClientCapabilitiesSchema,
        clientInfo: ImplementationSchema,
    }),
});
/**
 * Capabilities that a server may support. Known capabilities are defined here, in this schema, but this is not a closed set: any server can define its own, additional capabilities.
 */
const ServerCapabilitiesSchema = objectType({
    /**
     * Experimental, non-standard capabilities that the server supports.
     */
    experimental: optionalType(objectType({}).passthrough()),
    /**
     * Present if the server supports sending log messages to the client.
     */
    logging: optionalType(objectType({}).passthrough()),
    /**
     * Present if the server supports sending completions to the client.
     */
    completions: optionalType(objectType({}).passthrough()),
    /**
     * Present if the server offers any prompt templates.
     */
    prompts: optionalType(objectType({
        /**
         * Whether this server supports issuing notifications for changes to the prompt list.
         */
        listChanged: optionalType(booleanType()),
    })
        .passthrough()),
    /**
     * Present if the server offers any resources to read.
     */
    resources: optionalType(objectType({
        /**
         * Whether this server supports clients subscribing to resource updates.
         */
        subscribe: optionalType(booleanType()),
        /**
         * Whether this server supports issuing notifications for changes to the resource list.
         */
        listChanged: optionalType(booleanType()),
    })
        .passthrough()),
    /**
     * Present if the server offers any tools to call.
     */
    tools: optionalType(objectType({
        /**
         * Whether this server supports issuing notifications for changes to the tool list.
         */
        listChanged: optionalType(booleanType()),
    })
        .passthrough()),
})
    .passthrough();
/**
 * After receiving an initialize request from the client, the server sends this response.
 */
const InitializeResultSchema = ResultSchema.extend({
    /**
     * The version of the Model Context Protocol that the server wants to use. This may not match the version that the client requested. If the client cannot support this version, it MUST disconnect.
     */
    protocolVersion: stringType(),
    capabilities: ServerCapabilitiesSchema,
    serverInfo: ImplementationSchema,
    /**
     * Instructions describing how to use the server and its features.
     *
     * This can be used by clients to improve the LLM's understanding of available tools, resources, etc. It can be thought of like a "hint" to the model. For example, this information MAY be added to the system prompt.
     */
    instructions: optionalType(stringType()),
});
/**
 * This notification is sent from the client to the server after initialization has finished.
 */
const InitializedNotificationSchema = NotificationSchema.extend({
    method: literalType("notifications/initialized"),
});
const isInitializedNotification = (value) => InitializedNotificationSchema.safeParse(value).success;
/* Ping */
/**
 * A ping, issued by either the server or the client, to check that the other party is still alive. The receiver must promptly respond, or else may be disconnected.
 */
const PingRequestSchema = RequestSchema.extend({
    method: literalType("ping"),
});
/* Progress notifications */
const ProgressSchema = objectType({
    /**
     * The progress thus far. This should increase every time progress is made, even if the total is unknown.
     */
    progress: numberType(),
    /**
     * Total number of items to process (or total progress required), if known.
     */
    total: optionalType(numberType()),
    /**
     * An optional message describing the current progress.
     */
    message: optionalType(stringType()),
})
    .passthrough();
/**
 * An out-of-band notification used to inform the receiver of a progress update for a long-running request.
 */
const ProgressNotificationSchema = NotificationSchema.extend({
    method: literalType("notifications/progress"),
    params: BaseNotificationParamsSchema.merge(ProgressSchema).extend({
        /**
         * The progress token which was given in the initial request, used to associate this notification with the request that is proceeding.
         */
        progressToken: ProgressTokenSchema,
    }),
});
/* Pagination */
const PaginatedRequestSchema = RequestSchema.extend({
    params: BaseRequestParamsSchema.extend({
        /**
         * An opaque token representing the current pagination position.
         * If provided, the server should return results starting after this cursor.
         */
        cursor: optionalType(CursorSchema),
    }).optional(),
});
const PaginatedResultSchema = ResultSchema.extend({
    /**
     * An opaque token representing the pagination position after the last returned result.
     * If present, there may be more results available.
     */
    nextCursor: optionalType(CursorSchema),
});
/* Resources */
/**
 * The contents of a specific resource or sub-resource.
 */
const ResourceContentsSchema = objectType({
    /**
     * The URI of this resource.
     */
    uri: stringType(),
    /**
     * The MIME type of this resource, if known.
     */
    mimeType: optionalType(stringType()),
    /**
     * See [MCP specification](https://github.com/modelcontextprotocol/modelcontextprotocol/blob/47339c03c143bb4ec01a26e721a1b8fe66634ebe/docs/specification/draft/basic/index.mdx#general-fields)
     * for notes on _meta usage.
     */
    _meta: optionalType(objectType({}).passthrough()),
})
    .passthrough();
const TextResourceContentsSchema = ResourceContentsSchema.extend({
    /**
     * The text of the item. This must only be set if the item can actually be represented as text (not binary data).
     */
    text: stringType(),
});
const BlobResourceContentsSchema = ResourceContentsSchema.extend({
    /**
     * A base64-encoded string representing the binary data of the item.
     */
    blob: stringType().base64(),
});
/**
 * A known resource that the server is capable of reading.
 */
const ResourceSchema = BaseMetadataSchema.extend({
    /**
     * The URI of this resource.
     */
    uri: stringType(),
    /**
     * A description of what this resource represents.
     *
     * This can be used by clients to improve the LLM's understanding of available resources. It can be thought of like a "hint" to the model.
     */
    description: optionalType(stringType()),
    /**
     * The MIME type of this resource, if known.
     */
    mimeType: optionalType(stringType()),
    /**
     * See [MCP specification](https://github.com/modelcontextprotocol/modelcontextprotocol/blob/47339c03c143bb4ec01a26e721a1b8fe66634ebe/docs/specification/draft/basic/index.mdx#general-fields)
     * for notes on _meta usage.
     */
    _meta: optionalType(objectType({}).passthrough()),
});
/**
 * A template description for resources available on the server.
 */
const ResourceTemplateSchema = BaseMetadataSchema.extend({
    /**
     * A URI template (according to RFC 6570) that can be used to construct resource URIs.
     */
    uriTemplate: stringType(),
    /**
     * A description of what this template is for.
     *
     * This can be used by clients to improve the LLM's understanding of available resources. It can be thought of like a "hint" to the model.
     */
    description: optionalType(stringType()),
    /**
     * The MIME type for all resources that match this template. This should only be included if all resources matching this template have the same type.
     */
    mimeType: optionalType(stringType()),
    /**
     * See [MCP specification](https://github.com/modelcontextprotocol/modelcontextprotocol/blob/47339c03c143bb4ec01a26e721a1b8fe66634ebe/docs/specification/draft/basic/index.mdx#general-fields)
     * for notes on _meta usage.
     */
    _meta: optionalType(objectType({}).passthrough()),
});
/**
 * Sent from the client to request a list of resources the server has.
 */
const ListResourcesRequestSchema = PaginatedRequestSchema.extend({
    method: literalType("resources/list"),
});
/**
 * The server's response to a resources/list request from the client.
 */
const ListResourcesResultSchema = PaginatedResultSchema.extend({
    resources: arrayType(ResourceSchema),
});
/**
 * Sent from the client to request a list of resource templates the server has.
 */
const ListResourceTemplatesRequestSchema = PaginatedRequestSchema.extend({
    method: literalType("resources/templates/list"),
});
/**
 * The server's response to a resources/templates/list request from the client.
 */
const ListResourceTemplatesResultSchema = PaginatedResultSchema.extend({
    resourceTemplates: arrayType(ResourceTemplateSchema),
});
/**
 * Sent from the client to the server, to read a specific resource URI.
 */
const ReadResourceRequestSchema = RequestSchema.extend({
    method: literalType("resources/read"),
    params: BaseRequestParamsSchema.extend({
        /**
         * The URI of the resource to read. The URI can use any protocol; it is up to the server how to interpret it.
         */
        uri: stringType(),
    }),
});
/**
 * The server's response to a resources/read request from the client.
 */
const ReadResourceResultSchema = ResultSchema.extend({
    contents: arrayType(unionType([TextResourceContentsSchema, BlobResourceContentsSchema])),
});
/**
 * An optional notification from the server to the client, informing it that the list of resources it can read from has changed. This may be issued by servers without any previous subscription from the client.
 */
const ResourceListChangedNotificationSchema = NotificationSchema.extend({
    method: literalType("notifications/resources/list_changed"),
});
/**
 * Sent from the client to request resources/updated notifications from the server whenever a particular resource changes.
 */
const SubscribeRequestSchema = RequestSchema.extend({
    method: literalType("resources/subscribe"),
    params: BaseRequestParamsSchema.extend({
        /**
         * The URI of the resource to subscribe to. The URI can use any protocol; it is up to the server how to interpret it.
         */
        uri: stringType(),
    }),
});
/**
 * Sent from the client to request cancellation of resources/updated notifications from the server. This should follow a previous resources/subscribe request.
 */
const UnsubscribeRequestSchema = RequestSchema.extend({
    method: literalType("resources/unsubscribe"),
    params: BaseRequestParamsSchema.extend({
        /**
         * The URI of the resource to unsubscribe from.
         */
        uri: stringType(),
    }),
});
/**
 * A notification from the server to the client, informing it that a resource has changed and may need to be read again. This should only be sent if the client previously sent a resources/subscribe request.
 */
const ResourceUpdatedNotificationSchema = NotificationSchema.extend({
    method: literalType("notifications/resources/updated"),
    params: BaseNotificationParamsSchema.extend({
        /**
         * The URI of the resource that has been updated. This might be a sub-resource of the one that the client actually subscribed to.
         */
        uri: stringType(),
    }),
});
/* Prompts */
/**
 * Describes an argument that a prompt can accept.
 */
const PromptArgumentSchema = objectType({
    /**
     * The name of the argument.
     */
    name: stringType(),
    /**
     * A human-readable description of the argument.
     */
    description: optionalType(stringType()),
    /**
     * Whether this argument must be provided.
     */
    required: optionalType(booleanType()),
})
    .passthrough();
/**
 * A prompt or prompt template that the server offers.
 */
const PromptSchema = BaseMetadataSchema.extend({
    /**
     * An optional description of what this prompt provides
     */
    description: optionalType(stringType()),
    /**
     * A list of arguments to use for templating the prompt.
     */
    arguments: optionalType(arrayType(PromptArgumentSchema)),
    /**
     * See [MCP specification](https://github.com/modelcontextprotocol/modelcontextprotocol/blob/47339c03c143bb4ec01a26e721a1b8fe66634ebe/docs/specification/draft/basic/index.mdx#general-fields)
     * for notes on _meta usage.
     */
    _meta: optionalType(objectType({}).passthrough()),
});
/**
 * Sent from the client to request a list of prompts and prompt templates the server has.
 */
const ListPromptsRequestSchema = PaginatedRequestSchema.extend({
    method: literalType("prompts/list"),
});
/**
 * The server's response to a prompts/list request from the client.
 */
const ListPromptsResultSchema = PaginatedResultSchema.extend({
    prompts: arrayType(PromptSchema),
});
/**
 * Used by the client to get a prompt provided by the server.
 */
const GetPromptRequestSchema = RequestSchema.extend({
    method: literalType("prompts/get"),
    params: BaseRequestParamsSchema.extend({
        /**
         * The name of the prompt or prompt template.
         */
        name: stringType(),
        /**
         * Arguments to use for templating the prompt.
         */
        arguments: optionalType(recordType(stringType())),
    }),
});
/**
 * Text provided to or from an LLM.
 */
const TextContentSchema = objectType({
    type: literalType("text"),
    /**
     * The text content of the message.
     */
    text: stringType(),
    /**
     * See [MCP specification](https://github.com/modelcontextprotocol/modelcontextprotocol/blob/47339c03c143bb4ec01a26e721a1b8fe66634ebe/docs/specification/draft/basic/index.mdx#general-fields)
     * for notes on _meta usage.
     */
    _meta: optionalType(objectType({}).passthrough()),
})
    .passthrough();
/**
 * An image provided to or from an LLM.
 */
const ImageContentSchema = objectType({
    type: literalType("image"),
    /**
     * The base64-encoded image data.
     */
    data: stringType().base64(),
    /**
     * The MIME type of the image. Different providers may support different image types.
     */
    mimeType: stringType(),
    /**
     * See [MCP specification](https://github.com/modelcontextprotocol/modelcontextprotocol/blob/47339c03c143bb4ec01a26e721a1b8fe66634ebe/docs/specification/draft/basic/index.mdx#general-fields)
     * for notes on _meta usage.
     */
    _meta: optionalType(objectType({}).passthrough()),
})
    .passthrough();
/**
 * An Audio provided to or from an LLM.
 */
const AudioContentSchema = objectType({
    type: literalType("audio"),
    /**
     * The base64-encoded audio data.
     */
    data: stringType().base64(),
    /**
     * The MIME type of the audio. Different providers may support different audio types.
     */
    mimeType: stringType(),
    /**
     * See [MCP specification](https://github.com/modelcontextprotocol/modelcontextprotocol/blob/47339c03c143bb4ec01a26e721a1b8fe66634ebe/docs/specification/draft/basic/index.mdx#general-fields)
     * for notes on _meta usage.
     */
    _meta: optionalType(objectType({}).passthrough()),
})
    .passthrough();
/**
 * The contents of a resource, embedded into a prompt or tool call result.
 */
const EmbeddedResourceSchema = objectType({
    type: literalType("resource"),
    resource: unionType([TextResourceContentsSchema, BlobResourceContentsSchema]),
    /**
     * See [MCP specification](https://github.com/modelcontextprotocol/modelcontextprotocol/blob/47339c03c143bb4ec01a26e721a1b8fe66634ebe/docs/specification/draft/basic/index.mdx#general-fields)
     * for notes on _meta usage.
     */
    _meta: optionalType(objectType({}).passthrough()),
})
    .passthrough();
/**
 * A resource that the server is capable of reading, included in a prompt or tool call result.
 *
 * Note: resource links returned by tools are not guaranteed to appear in the results of `resources/list` requests.
 */
const ResourceLinkSchema = ResourceSchema.extend({
    type: literalType("resource_link"),
});
/**
 * A content block that can be used in prompts and tool results.
 */
const ContentBlockSchema = unionType([
    TextContentSchema,
    ImageContentSchema,
    AudioContentSchema,
    ResourceLinkSchema,
    EmbeddedResourceSchema,
]);
/**
 * Describes a message returned as part of a prompt.
 */
const PromptMessageSchema = objectType({
    role: enumType(["user", "assistant"]),
    content: ContentBlockSchema,
})
    .passthrough();
/**
 * The server's response to a prompts/get request from the client.
 */
const GetPromptResultSchema = ResultSchema.extend({
    /**
     * An optional description for the prompt.
     */
    description: optionalType(stringType()),
    messages: arrayType(PromptMessageSchema),
});
/**
 * An optional notification from the server to the client, informing it that the list of prompts it offers has changed. This may be issued by servers without any previous subscription from the client.
 */
const PromptListChangedNotificationSchema = NotificationSchema.extend({
    method: literalType("notifications/prompts/list_changed"),
});
/* Tools */
/**
 * Additional properties describing a Tool to clients.
 *
 * NOTE: all properties in ToolAnnotations are **hints**.
 * They are not guaranteed to provide a faithful description of
 * tool behavior (including descriptive properties like `title`).
 *
 * Clients should never make tool use decisions based on ToolAnnotations
 * received from untrusted servers.
 */
const ToolAnnotationsSchema = objectType({
    /**
     * A human-readable title for the tool.
     */
    title: optionalType(stringType()),
    /**
     * If true, the tool does not modify its environment.
     *
     * Default: false
     */
    readOnlyHint: optionalType(booleanType()),
    /**
     * If true, the tool may perform destructive updates to its environment.
     * If false, the tool performs only additive updates.
     *
     * (This property is meaningful only when `readOnlyHint == false`)
     *
     * Default: true
     */
    destructiveHint: optionalType(booleanType()),
    /**
     * If true, calling the tool repeatedly with the same arguments
     * will have no additional effect on the its environment.
     *
     * (This property is meaningful only when `readOnlyHint == false`)
     *
     * Default: false
     */
    idempotentHint: optionalType(booleanType()),
    /**
     * If true, this tool may interact with an "open world" of external
     * entities. If false, the tool's domain of interaction is closed.
     * For example, the world of a web search tool is open, whereas that
     * of a memory tool is not.
     *
     * Default: true
     */
    openWorldHint: optionalType(booleanType()),
})
    .passthrough();
/**
 * Definition for a tool the client can call.
 */
const ToolSchema = BaseMetadataSchema.extend({
    /**
     * A human-readable description of the tool.
     */
    description: optionalType(stringType()),
    /**
     * A JSON Schema object defining the expected parameters for the tool.
     */
    inputSchema: objectType({
        type: literalType("object"),
        properties: optionalType(objectType({}).passthrough()),
        required: optionalType(arrayType(stringType())),
    })
        .passthrough(),
    /**
     * An optional JSON Schema object defining the structure of the tool's output returned in
     * the structuredContent field of a CallToolResult.
     */
    outputSchema: optionalType(objectType({
        type: literalType("object"),
        properties: optionalType(objectType({}).passthrough()),
        required: optionalType(arrayType(stringType())),
    })
        .passthrough()),
    /**
     * Optional additional tool information.
     */
    annotations: optionalType(ToolAnnotationsSchema),
    /**
     * See [MCP specification](https://github.com/modelcontextprotocol/modelcontextprotocol/blob/47339c03c143bb4ec01a26e721a1b8fe66634ebe/docs/specification/draft/basic/index.mdx#general-fields)
     * for notes on _meta usage.
     */
    _meta: optionalType(objectType({}).passthrough()),
});
/**
 * Sent from the client to request a list of tools the server has.
 */
const ListToolsRequestSchema = PaginatedRequestSchema.extend({
    method: literalType("tools/list"),
});
/**
 * The server's response to a tools/list request from the client.
 */
const ListToolsResultSchema = PaginatedResultSchema.extend({
    tools: arrayType(ToolSchema),
});
/**
 * The server's response to a tool call.
 */
const CallToolResultSchema = ResultSchema.extend({
    /**
     * A list of content objects that represent the result of the tool call.
     *
     * If the Tool does not define an outputSchema, this field MUST be present in the result.
     * For backwards compatibility, this field is always present, but it may be empty.
     */
    content: arrayType(ContentBlockSchema).default([]),
    /**
     * An object containing structured tool output.
     *
     * If the Tool defines an outputSchema, this field MUST be present in the result, and contain a JSON object that matches the schema.
     */
    structuredContent: objectType({}).passthrough().optional(),
    /**
     * Whether the tool call ended in an error.
     *
     * If not set, this is assumed to be false (the call was successful).
     *
     * Any errors that originate from the tool SHOULD be reported inside the result
     * object, with `isError` set to true, _not_ as an MCP protocol-level error
     * response. Otherwise, the LLM would not be able to see that an error occurred
     * and self-correct.
     *
     * However, any errors in _finding_ the tool, an error indicating that the
     * server does not support tool calls, or any other exceptional conditions,
     * should be reported as an MCP error response.
     */
    isError: optionalType(booleanType()),
});
/**
 * CallToolResultSchema extended with backwards compatibility to protocol version 2024-10-07.
 */
CallToolResultSchema.or(ResultSchema.extend({
    toolResult: unknownType(),
}));
/**
 * Used by the client to invoke a tool provided by the server.
 */
const CallToolRequestSchema = RequestSchema.extend({
    method: literalType("tools/call"),
    params: BaseRequestParamsSchema.extend({
        name: stringType(),
        arguments: optionalType(recordType(unknownType())),
    }),
});
/**
 * An optional notification from the server to the client, informing it that the list of tools it offers has changed. This may be issued by servers without any previous subscription from the client.
 */
const ToolListChangedNotificationSchema = NotificationSchema.extend({
    method: literalType("notifications/tools/list_changed"),
});
/* Logging */
/**
 * The severity of a log message.
 */
const LoggingLevelSchema = enumType([
    "debug",
    "info",
    "notice",
    "warning",
    "error",
    "critical",
    "alert",
    "emergency",
]);
/**
 * A request from the client to the server, to enable or adjust logging.
 */
const SetLevelRequestSchema = RequestSchema.extend({
    method: literalType("logging/setLevel"),
    params: BaseRequestParamsSchema.extend({
        /**
         * The level of logging that the client wants to receive from the server. The server should send all logs at this level and higher (i.e., more severe) to the client as notifications/logging/message.
         */
        level: LoggingLevelSchema,
    }),
});
/**
 * Notification of a log message passed from server to client. If no logging/setLevel request has been sent from the client, the server MAY decide which messages to send automatically.
 */
const LoggingMessageNotificationSchema = NotificationSchema.extend({
    method: literalType("notifications/message"),
    params: BaseNotificationParamsSchema.extend({
        /**
         * The severity of this log message.
         */
        level: LoggingLevelSchema,
        /**
         * An optional name of the logger issuing this message.
         */
        logger: optionalType(stringType()),
        /**
         * The data to be logged, such as a string message or an object. Any JSON serializable type is allowed here.
         */
        data: unknownType(),
    }),
});
/* Sampling */
/**
 * Hints to use for model selection.
 */
const ModelHintSchema = objectType({
    /**
     * A hint for a model name.
     */
    name: stringType().optional(),
})
    .passthrough();
/**
 * The server's preferences for model selection, requested of the client during sampling.
 */
const ModelPreferencesSchema = objectType({
    /**
     * Optional hints to use for model selection.
     */
    hints: optionalType(arrayType(ModelHintSchema)),
    /**
     * How much to prioritize cost when selecting a model.
     */
    costPriority: optionalType(numberType().min(0).max(1)),
    /**
     * How much to prioritize sampling speed (latency) when selecting a model.
     */
    speedPriority: optionalType(numberType().min(0).max(1)),
    /**
     * How much to prioritize intelligence and capabilities when selecting a model.
     */
    intelligencePriority: optionalType(numberType().min(0).max(1)),
})
    .passthrough();
/**
 * Describes a message issued to or received from an LLM API.
 */
const SamplingMessageSchema = objectType({
    role: enumType(["user", "assistant"]),
    content: unionType([TextContentSchema, ImageContentSchema, AudioContentSchema]),
})
    .passthrough();
/**
 * A request from the server to sample an LLM via the client. The client has full discretion over which model to select. The client should also inform the user before beginning sampling, to allow them to inspect the request (human in the loop) and decide whether to approve it.
 */
const CreateMessageRequestSchema = RequestSchema.extend({
    method: literalType("sampling/createMessage"),
    params: BaseRequestParamsSchema.extend({
        messages: arrayType(SamplingMessageSchema),
        /**
         * An optional system prompt the server wants to use for sampling. The client MAY modify or omit this prompt.
         */
        systemPrompt: optionalType(stringType()),
        /**
         * A request to include context from one or more MCP servers (including the caller), to be attached to the prompt. The client MAY ignore this request.
         */
        includeContext: optionalType(enumType(["none", "thisServer", "allServers"])),
        temperature: optionalType(numberType()),
        /**
         * The maximum number of tokens to sample, as requested by the server. The client MAY choose to sample fewer tokens than requested.
         */
        maxTokens: numberType().int(),
        stopSequences: optionalType(arrayType(stringType())),
        /**
         * Optional metadata to pass through to the LLM provider. The format of this metadata is provider-specific.
         */
        metadata: optionalType(objectType({}).passthrough()),
        /**
         * The server's preferences for which model to select.
         */
        modelPreferences: optionalType(ModelPreferencesSchema),
    }),
});
/**
 * The client's response to a sampling/create_message request from the server. The client should inform the user before returning the sampled message, to allow them to inspect the response (human in the loop) and decide whether to allow the server to see it.
 */
const CreateMessageResultSchema = ResultSchema.extend({
    /**
     * The name of the model that generated the message.
     */
    model: stringType(),
    /**
     * The reason why sampling stopped.
     */
    stopReason: optionalType(enumType(["endTurn", "stopSequence", "maxTokens"]).or(stringType())),
    role: enumType(["user", "assistant"]),
    content: discriminatedUnionType("type", [
        TextContentSchema,
        ImageContentSchema,
        AudioContentSchema
    ]),
});
/* Elicitation */
/**
 * Primitive schema definition for boolean fields.
 */
const BooleanSchemaSchema = objectType({
    type: literalType("boolean"),
    title: optionalType(stringType()),
    description: optionalType(stringType()),
    default: optionalType(booleanType()),
})
    .passthrough();
/**
 * Primitive schema definition for string fields.
 */
const StringSchemaSchema = objectType({
    type: literalType("string"),
    title: optionalType(stringType()),
    description: optionalType(stringType()),
    minLength: optionalType(numberType()),
    maxLength: optionalType(numberType()),
    format: optionalType(enumType(["email", "uri", "date", "date-time"])),
})
    .passthrough();
/**
 * Primitive schema definition for number fields.
 */
const NumberSchemaSchema = objectType({
    type: enumType(["number", "integer"]),
    title: optionalType(stringType()),
    description: optionalType(stringType()),
    minimum: optionalType(numberType()),
    maximum: optionalType(numberType()),
})
    .passthrough();
/**
 * Primitive schema definition for enum fields.
 */
const EnumSchemaSchema = objectType({
    type: literalType("string"),
    title: optionalType(stringType()),
    description: optionalType(stringType()),
    enum: arrayType(stringType()),
    enumNames: optionalType(arrayType(stringType())),
})
    .passthrough();
/**
 * Union of all primitive schema definitions.
 */
const PrimitiveSchemaDefinitionSchema = unionType([
    BooleanSchemaSchema,
    StringSchemaSchema,
    NumberSchemaSchema,
    EnumSchemaSchema,
]);
/**
 * A request from the server to elicit user input via the client.
 * The client should present the message and form fields to the user.
 */
const ElicitRequestSchema = RequestSchema.extend({
    method: literalType("elicitation/create"),
    params: BaseRequestParamsSchema.extend({
        /**
         * The message to present to the user.
         */
        message: stringType(),
        /**
         * The schema for the requested user input.
         */
        requestedSchema: objectType({
            type: literalType("object"),
            properties: recordType(stringType(), PrimitiveSchemaDefinitionSchema),
            required: optionalType(arrayType(stringType())),
        })
            .passthrough(),
    }),
});
/**
 * The client's response to an elicitation/create request from the server.
 */
const ElicitResultSchema = ResultSchema.extend({
    /**
     * The user's response action.
     */
    action: enumType(["accept", "decline", "cancel"]),
    /**
     * The collected user input content (only present if action is "accept").
     */
    content: optionalType(recordType(stringType(), unknownType())),
});
/* Autocomplete */
/**
 * A reference to a resource or resource template definition.
 */
const ResourceTemplateReferenceSchema = objectType({
    type: literalType("ref/resource"),
    /**
     * The URI or URI template of the resource.
     */
    uri: stringType(),
})
    .passthrough();
/**
 * Identifies a prompt.
 */
const PromptReferenceSchema = objectType({
    type: literalType("ref/prompt"),
    /**
     * The name of the prompt or prompt template
     */
    name: stringType(),
})
    .passthrough();
/**
 * A request from the client to the server, to ask for completion options.
 */
const CompleteRequestSchema = RequestSchema.extend({
    method: literalType("completion/complete"),
    params: BaseRequestParamsSchema.extend({
        ref: unionType([PromptReferenceSchema, ResourceTemplateReferenceSchema]),
        /**
         * The argument's information
         */
        argument: objectType({
            /**
             * The name of the argument
             */
            name: stringType(),
            /**
             * The value of the argument to use for completion matching.
             */
            value: stringType(),
        })
            .passthrough(),
        context: optionalType(objectType({
            /**
             * Previously-resolved variables in a URI template or prompt.
             */
            arguments: optionalType(recordType(stringType(), stringType())),
        })),
    }),
});
/**
 * The server's response to a completion/complete request
 */
const CompleteResultSchema = ResultSchema.extend({
    completion: objectType({
        /**
         * An array of completion values. Must not exceed 100 items.
         */
        values: arrayType(stringType()).max(100),
        /**
         * The total number of completion options available. This can exceed the number of values actually sent in the response.
         */
        total: optionalType(numberType().int()),
        /**
         * Indicates whether there are additional completion options beyond those provided in the current response, even if the exact total is unknown.
         */
        hasMore: optionalType(booleanType()),
    })
        .passthrough(),
});
/* Roots */
/**
 * Represents a root directory or file that the server can operate on.
 */
const RootSchema = objectType({
    /**
     * The URI identifying the root. This *must* start with file:// for now.
     */
    uri: stringType().startsWith("file://"),
    /**
     * An optional name for the root.
     */
    name: optionalType(stringType()),
    /**
     * See [MCP specification](https://github.com/modelcontextprotocol/modelcontextprotocol/blob/47339c03c143bb4ec01a26e721a1b8fe66634ebe/docs/specification/draft/basic/index.mdx#general-fields)
     * for notes on _meta usage.
     */
    _meta: optionalType(objectType({}).passthrough()),
})
    .passthrough();
/**
 * Sent from the server to request a list of root URIs from the client.
 */
const ListRootsRequestSchema = RequestSchema.extend({
    method: literalType("roots/list"),
});
/**
 * The client's response to a roots/list request from the server.
 */
const ListRootsResultSchema = ResultSchema.extend({
    roots: arrayType(RootSchema),
});
/**
 * A notification from the client to the server, informing it that the list of roots has changed.
 */
const RootsListChangedNotificationSchema = NotificationSchema.extend({
    method: literalType("notifications/roots/list_changed"),
});
/* Client messages */
unionType([
    PingRequestSchema,
    InitializeRequestSchema,
    CompleteRequestSchema,
    SetLevelRequestSchema,
    GetPromptRequestSchema,
    ListPromptsRequestSchema,
    ListResourcesRequestSchema,
    ListResourceTemplatesRequestSchema,
    ReadResourceRequestSchema,
    SubscribeRequestSchema,
    UnsubscribeRequestSchema,
    CallToolRequestSchema,
    ListToolsRequestSchema,
]);
unionType([
    CancelledNotificationSchema,
    ProgressNotificationSchema,
    InitializedNotificationSchema,
    RootsListChangedNotificationSchema,
]);
unionType([
    EmptyResultSchema,
    CreateMessageResultSchema,
    ElicitResultSchema,
    ListRootsResultSchema,
]);
/* Server messages */
unionType([
    PingRequestSchema,
    CreateMessageRequestSchema,
    ElicitRequestSchema,
    ListRootsRequestSchema,
]);
unionType([
    CancelledNotificationSchema,
    ProgressNotificationSchema,
    LoggingMessageNotificationSchema,
    ResourceUpdatedNotificationSchema,
    ResourceListChangedNotificationSchema,
    ToolListChangedNotificationSchema,
    PromptListChangedNotificationSchema,
]);
unionType([
    EmptyResultSchema,
    InitializeResultSchema,
    CompleteResultSchema,
    GetPromptResultSchema,
    ListPromptsResultSchema,
    ListResourcesResultSchema,
    ListResourceTemplatesResultSchema,
    ReadResourceResultSchema,
    CallToolResultSchema,
    ListToolsResultSchema,
]);
class McpError extends Error {
    constructor(code, message, data) {
        super(`MCP error ${code}: ${message}`);
        this.code = code;
        this.data = data;
        this.name = "McpError";
    }
}

/**
 * The default request timeout, in miliseconds.
 */
const DEFAULT_REQUEST_TIMEOUT_MSEC = 60000;
/**
 * Implements MCP protocol framing on top of a pluggable transport, including
 * features like request/response linking, notifications, and progress.
 */
class Protocol {
    constructor(_options) {
        this._options = _options;
        this._requestMessageId = 0;
        this._requestHandlers = new Map();
        this._requestHandlerAbortControllers = new Map();
        this._notificationHandlers = new Map();
        this._responseHandlers = new Map();
        this._progressHandlers = new Map();
        this._timeoutInfo = new Map();
        this.setNotificationHandler(CancelledNotificationSchema, (notification) => {
            const controller = this._requestHandlerAbortControllers.get(notification.params.requestId);
            controller === null || controller === void 0 ? void 0 : controller.abort(notification.params.reason);
        });
        this.setNotificationHandler(ProgressNotificationSchema, (notification) => {
            this._onprogress(notification);
        });
        this.setRequestHandler(PingRequestSchema, 
        // Automatic pong by default.
        (_request) => ({}));
    }
    _setupTimeout(messageId, timeout, maxTotalTimeout, onTimeout, resetTimeoutOnProgress = false) {
        this._timeoutInfo.set(messageId, {
            timeoutId: setTimeout(onTimeout, timeout),
            startTime: Date.now(),
            timeout,
            maxTotalTimeout,
            resetTimeoutOnProgress,
            onTimeout
        });
    }
    _resetTimeout(messageId) {
        const info = this._timeoutInfo.get(messageId);
        if (!info)
            return false;
        const totalElapsed = Date.now() - info.startTime;
        if (info.maxTotalTimeout && totalElapsed >= info.maxTotalTimeout) {
            this._timeoutInfo.delete(messageId);
            throw new McpError(ErrorCode.RequestTimeout, "Maximum total timeout exceeded", { maxTotalTimeout: info.maxTotalTimeout, totalElapsed });
        }
        clearTimeout(info.timeoutId);
        info.timeoutId = setTimeout(info.onTimeout, info.timeout);
        return true;
    }
    _cleanupTimeout(messageId) {
        const info = this._timeoutInfo.get(messageId);
        if (info) {
            clearTimeout(info.timeoutId);
            this._timeoutInfo.delete(messageId);
        }
    }
    /**
     * Attaches to the given transport, starts it, and starts listening for messages.
     *
     * The Protocol object assumes ownership of the Transport, replacing any callbacks that have already been set, and expects that it is the only user of the Transport instance going forward.
     */
    async connect(transport) {
        var _a, _b, _c;
        this._transport = transport;
        const _onclose = (_a = this.transport) === null || _a === void 0 ? void 0 : _a.onclose;
        this._transport.onclose = () => {
            _onclose === null || _onclose === void 0 ? void 0 : _onclose();
            this._onclose();
        };
        const _onerror = (_b = this.transport) === null || _b === void 0 ? void 0 : _b.onerror;
        this._transport.onerror = (error) => {
            _onerror === null || _onerror === void 0 ? void 0 : _onerror(error);
            this._onerror(error);
        };
        const _onmessage = (_c = this._transport) === null || _c === void 0 ? void 0 : _c.onmessage;
        this._transport.onmessage = (message, extra) => {
            _onmessage === null || _onmessage === void 0 ? void 0 : _onmessage(message, extra);
            if (isJSONRPCResponse(message) || isJSONRPCError(message)) {
                this._onresponse(message);
            }
            else if (isJSONRPCRequest(message)) {
                this._onrequest(message, extra);
            }
            else if (isJSONRPCNotification(message)) {
                this._onnotification(message);
            }
            else {
                this._onerror(new Error(`Unknown message type: ${JSON.stringify(message)}`));
            }
        };
        await this._transport.start();
    }
    _onclose() {
        var _a;
        const responseHandlers = this._responseHandlers;
        this._responseHandlers = new Map();
        this._progressHandlers.clear();
        this._transport = undefined;
        (_a = this.onclose) === null || _a === void 0 ? void 0 : _a.call(this);
        const error = new McpError(ErrorCode.ConnectionClosed, "Connection closed");
        for (const handler of responseHandlers.values()) {
            handler(error);
        }
    }
    _onerror(error) {
        var _a;
        (_a = this.onerror) === null || _a === void 0 ? void 0 : _a.call(this, error);
    }
    _onnotification(notification) {
        var _a;
        const handler = (_a = this._notificationHandlers.get(notification.method)) !== null && _a !== void 0 ? _a : this.fallbackNotificationHandler;
        // Ignore notifications not being subscribed to.
        if (handler === undefined) {
            return;
        }
        // Starting with Promise.resolve() puts any synchronous errors into the monad as well.
        Promise.resolve()
            .then(() => handler(notification))
            .catch((error) => this._onerror(new Error(`Uncaught error in notification handler: ${error}`)));
    }
    _onrequest(request, extra) {
        var _a, _b, _c, _d;
        const handler = (_a = this._requestHandlers.get(request.method)) !== null && _a !== void 0 ? _a : this.fallbackRequestHandler;
        if (handler === undefined) {
            (_b = this._transport) === null || _b === void 0 ? void 0 : _b.send({
                jsonrpc: "2.0",
                id: request.id,
                error: {
                    code: ErrorCode.MethodNotFound,
                    message: "Method not found",
                },
            }).catch((error) => this._onerror(new Error(`Failed to send an error response: ${error}`)));
            return;
        }
        const abortController = new AbortController();
        this._requestHandlerAbortControllers.set(request.id, abortController);
        const fullExtra = {
            signal: abortController.signal,
            sessionId: (_c = this._transport) === null || _c === void 0 ? void 0 : _c.sessionId,
            _meta: (_d = request.params) === null || _d === void 0 ? void 0 : _d._meta,
            sendNotification: (notification) => this.notification(notification, { relatedRequestId: request.id }),
            sendRequest: (r, resultSchema, options) => this.request(r, resultSchema, { ...options, relatedRequestId: request.id }),
            authInfo: extra === null || extra === void 0 ? void 0 : extra.authInfo,
            requestId: request.id,
            requestInfo: extra === null || extra === void 0 ? void 0 : extra.requestInfo
        };
        // Starting with Promise.resolve() puts any synchronous errors into the monad as well.
        Promise.resolve()
            .then(() => handler(request, fullExtra))
            .then((result) => {
            var _a;
            if (abortController.signal.aborted) {
                return;
            }
            return (_a = this._transport) === null || _a === void 0 ? void 0 : _a.send({
                result,
                jsonrpc: "2.0",
                id: request.id,
            });
        }, (error) => {
            var _a, _b;
            if (abortController.signal.aborted) {
                return;
            }
            return (_a = this._transport) === null || _a === void 0 ? void 0 : _a.send({
                jsonrpc: "2.0",
                id: request.id,
                error: {
                    code: Number.isSafeInteger(error["code"])
                        ? error["code"]
                        : ErrorCode.InternalError,
                    message: (_b = error.message) !== null && _b !== void 0 ? _b : "Internal error",
                },
            });
        })
            .catch((error) => this._onerror(new Error(`Failed to send response: ${error}`)))
            .finally(() => {
            this._requestHandlerAbortControllers.delete(request.id);
        });
    }
    _onprogress(notification) {
        const { progressToken, ...params } = notification.params;
        const messageId = Number(progressToken);
        const handler = this._progressHandlers.get(messageId);
        if (!handler) {
            this._onerror(new Error(`Received a progress notification for an unknown token: ${JSON.stringify(notification)}`));
            return;
        }
        const responseHandler = this._responseHandlers.get(messageId);
        const timeoutInfo = this._timeoutInfo.get(messageId);
        if (timeoutInfo && responseHandler && timeoutInfo.resetTimeoutOnProgress) {
            try {
                this._resetTimeout(messageId);
            }
            catch (error) {
                responseHandler(error);
                return;
            }
        }
        handler(params);
    }
    _onresponse(response) {
        const messageId = Number(response.id);
        const handler = this._responseHandlers.get(messageId);
        if (handler === undefined) {
            this._onerror(new Error(`Received a response for an unknown message ID: ${JSON.stringify(response)}`));
            return;
        }
        this._responseHandlers.delete(messageId);
        this._progressHandlers.delete(messageId);
        this._cleanupTimeout(messageId);
        if (isJSONRPCResponse(response)) {
            handler(response);
        }
        else {
            const error = new McpError(response.error.code, response.error.message, response.error.data);
            handler(error);
        }
    }
    get transport() {
        return this._transport;
    }
    /**
     * Closes the connection.
     */
    async close() {
        var _a;
        await ((_a = this._transport) === null || _a === void 0 ? void 0 : _a.close());
    }
    /**
     * Sends a request and wait for a response.
     *
     * Do not use this method to emit notifications! Use notification() instead.
     */
    request(request, resultSchema, options) {
        const { relatedRequestId, resumptionToken, onresumptiontoken } = options !== null && options !== void 0 ? options : {};
        return new Promise((resolve, reject) => {
            var _a, _b, _c, _d, _e, _f;
            if (!this._transport) {
                reject(new Error("Not connected"));
                return;
            }
            if (((_a = this._options) === null || _a === void 0 ? void 0 : _a.enforceStrictCapabilities) === true) {
                this.assertCapabilityForMethod(request.method);
            }
            (_b = options === null || options === void 0 ? void 0 : options.signal) === null || _b === void 0 ? void 0 : _b.throwIfAborted();
            const messageId = this._requestMessageId++;
            const jsonrpcRequest = {
                ...request,
                jsonrpc: "2.0",
                id: messageId,
            };
            if (options === null || options === void 0 ? void 0 : options.onprogress) {
                this._progressHandlers.set(messageId, options.onprogress);
                jsonrpcRequest.params = {
                    ...request.params,
                    _meta: {
                        ...(((_c = request.params) === null || _c === void 0 ? void 0 : _c._meta) || {}),
                        progressToken: messageId
                    },
                };
            }
            const cancel = (reason) => {
                var _a;
                this._responseHandlers.delete(messageId);
                this._progressHandlers.delete(messageId);
                this._cleanupTimeout(messageId);
                (_a = this._transport) === null || _a === void 0 ? void 0 : _a.send({
                    jsonrpc: "2.0",
                    method: "notifications/cancelled",
                    params: {
                        requestId: messageId,
                        reason: String(reason),
                    },
                }, { relatedRequestId, resumptionToken, onresumptiontoken }).catch((error) => this._onerror(new Error(`Failed to send cancellation: ${error}`)));
                reject(reason);
            };
            this._responseHandlers.set(messageId, (response) => {
                var _a;
                if ((_a = options === null || options === void 0 ? void 0 : options.signal) === null || _a === void 0 ? void 0 : _a.aborted) {
                    return;
                }
                if (response instanceof Error) {
                    return reject(response);
                }
                try {
                    const result = resultSchema.parse(response.result);
                    resolve(result);
                }
                catch (error) {
                    reject(error);
                }
            });
            (_d = options === null || options === void 0 ? void 0 : options.signal) === null || _d === void 0 ? void 0 : _d.addEventListener("abort", () => {
                var _a;
                cancel((_a = options === null || options === void 0 ? void 0 : options.signal) === null || _a === void 0 ? void 0 : _a.reason);
            });
            const timeout = (_e = options === null || options === void 0 ? void 0 : options.timeout) !== null && _e !== void 0 ? _e : DEFAULT_REQUEST_TIMEOUT_MSEC;
            const timeoutHandler = () => cancel(new McpError(ErrorCode.RequestTimeout, "Request timed out", { timeout }));
            this._setupTimeout(messageId, timeout, options === null || options === void 0 ? void 0 : options.maxTotalTimeout, timeoutHandler, (_f = options === null || options === void 0 ? void 0 : options.resetTimeoutOnProgress) !== null && _f !== void 0 ? _f : false);
            this._transport.send(jsonrpcRequest, { relatedRequestId, resumptionToken, onresumptiontoken }).catch((error) => {
                this._cleanupTimeout(messageId);
                reject(error);
            });
        });
    }
    /**
     * Emits a notification, which is a one-way message that does not expect a response.
     */
    async notification(notification, options) {
        if (!this._transport) {
            throw new Error("Not connected");
        }
        this.assertNotificationCapability(notification.method);
        const jsonrpcNotification = {
            ...notification,
            jsonrpc: "2.0",
        };
        await this._transport.send(jsonrpcNotification, options);
    }
    /**
     * Registers a handler to invoke when this protocol object receives a request with the given method.
     *
     * Note that this will replace any previous request handler for the same method.
     */
    setRequestHandler(requestSchema, handler) {
        const method = requestSchema.shape.method.value;
        this.assertRequestHandlerCapability(method);
        this._requestHandlers.set(method, (request, extra) => {
            return Promise.resolve(handler(requestSchema.parse(request), extra));
        });
    }
    /**
     * Removes the request handler for the given method.
     */
    removeRequestHandler(method) {
        this._requestHandlers.delete(method);
    }
    /**
     * Asserts that a request handler has not already been set for the given method, in preparation for a new one being automatically installed.
     */
    assertCanSetRequestHandler(method) {
        if (this._requestHandlers.has(method)) {
            throw new Error(`A request handler for ${method} already exists, which would be overridden`);
        }
    }
    /**
     * Registers a handler to invoke when this protocol object receives a notification with the given method.
     *
     * Note that this will replace any previous notification handler for the same method.
     */
    setNotificationHandler(notificationSchema, handler) {
        this._notificationHandlers.set(notificationSchema.shape.method.value, (notification) => Promise.resolve(handler(notificationSchema.parse(notification))));
    }
    /**
     * Removes the notification handler for the given method.
     */
    removeNotificationHandler(method) {
        this._notificationHandlers.delete(method);
    }
}
function mergeCapabilities(base, additional) {
    return Object.entries(additional).reduce((acc, [key, value]) => {
        if (value && typeof value === "object") {
            acc[key] = acc[key] ? { ...acc[key], ...value } : value;
        }
        else {
            acc[key] = value;
        }
        return acc;
    }, { ...base });
}

function getDefaultExportFromCjs (x) {
	return x && x.__esModule && Object.prototype.hasOwnProperty.call(x, 'default') ? x['default'] : x;
}

var uri_all$1 = {exports: {}};

/** @license URI.js v4.4.1 (c) 2011 Gary Court. License: http://github.com/garycourt/uri-js */
var uri_all = uri_all$1.exports;

var hasRequiredUri_all;

function requireUri_all () {
	if (hasRequiredUri_all) return uri_all$1.exports;
	hasRequiredUri_all = 1;
	(function (module, exports) {
		(function (global, factory) {
			factory(exports) ;
		}(uri_all, (function (exports) {
		function merge() {
		    for (var _len = arguments.length, sets = Array(_len), _key = 0; _key < _len; _key++) {
		        sets[_key] = arguments[_key];
		    }

		    if (sets.length > 1) {
		        sets[0] = sets[0].slice(0, -1);
		        var xl = sets.length - 1;
		        for (var x = 1; x < xl; ++x) {
		            sets[x] = sets[x].slice(1, -1);
		        }
		        sets[xl] = sets[xl].slice(1);
		        return sets.join('');
		    } else {
		        return sets[0];
		    }
		}
		function subexp(str) {
		    return "(?:" + str + ")";
		}
		function typeOf(o) {
		    return o === undefined ? "undefined" : o === null ? "null" : Object.prototype.toString.call(o).split(" ").pop().split("]").shift().toLowerCase();
		}
		function toUpperCase(str) {
		    return str.toUpperCase();
		}
		function toArray(obj) {
		    return obj !== undefined && obj !== null ? obj instanceof Array ? obj : typeof obj.length !== "number" || obj.split || obj.setInterval || obj.call ? [obj] : Array.prototype.slice.call(obj) : [];
		}
		function assign(target, source) {
		    var obj = target;
		    if (source) {
		        for (var key in source) {
		            obj[key] = source[key];
		        }
		    }
		    return obj;
		}

		function buildExps(isIRI) {
		    var ALPHA$$ = "[A-Za-z]",
		        DIGIT$$ = "[0-9]",
		        HEXDIG$$ = merge(DIGIT$$, "[A-Fa-f]"),
		        PCT_ENCODED$ = subexp(subexp("%[EFef]" + HEXDIG$$ + "%" + HEXDIG$$ + HEXDIG$$ + "%" + HEXDIG$$ + HEXDIG$$) + "|" + subexp("%[89A-Fa-f]" + HEXDIG$$ + "%" + HEXDIG$$ + HEXDIG$$) + "|" + subexp("%" + HEXDIG$$ + HEXDIG$$)),
		        //expanded
		    GEN_DELIMS$$ = "[\\:\\/\\?\\#\\[\\]\\@]",
		        SUB_DELIMS$$ = "[\\!\\$\\&\\'\\(\\)\\*\\+\\,\\;\\=]",
		        RESERVED$$ = merge(GEN_DELIMS$$, SUB_DELIMS$$),
		        UCSCHAR$$ = isIRI ? "[\\xA0-\\u200D\\u2010-\\u2029\\u202F-\\uD7FF\\uF900-\\uFDCF\\uFDF0-\\uFFEF]" : "[]",
		        //subset, excludes bidi control characters
		    IPRIVATE$$ = isIRI ? "[\\uE000-\\uF8FF]" : "[]",
		        //subset
		    UNRESERVED$$ = merge(ALPHA$$, DIGIT$$, "[\\-\\.\\_\\~]", UCSCHAR$$);
		        subexp(ALPHA$$ + merge(ALPHA$$, DIGIT$$, "[\\+\\-\\.]") + "*");
		        subexp(subexp(PCT_ENCODED$ + "|" + merge(UNRESERVED$$, SUB_DELIMS$$, "[\\:]")) + "*");
		        var DEC_OCTET_RELAXED$ = subexp(subexp("25[0-5]") + "|" + subexp("2[0-4]" + DIGIT$$) + "|" + subexp("1" + DIGIT$$ + DIGIT$$) + "|" + subexp("0?[1-9]" + DIGIT$$) + "|0?0?" + DIGIT$$),
		        //relaxed parsing rules
		    IPV4ADDRESS$ = subexp(DEC_OCTET_RELAXED$ + "\\." + DEC_OCTET_RELAXED$ + "\\." + DEC_OCTET_RELAXED$ + "\\." + DEC_OCTET_RELAXED$),
		        H16$ = subexp(HEXDIG$$ + "{1,4}"),
		        LS32$ = subexp(subexp(H16$ + "\\:" + H16$) + "|" + IPV4ADDRESS$),
		        IPV6ADDRESS1$ = subexp(subexp(H16$ + "\\:") + "{6}" + LS32$),
		        //                           6( h16 ":" ) ls32
		    IPV6ADDRESS2$ = subexp("\\:\\:" + subexp(H16$ + "\\:") + "{5}" + LS32$),
		        //                      "::" 5( h16 ":" ) ls32
		    IPV6ADDRESS3$ = subexp(subexp(H16$) + "?\\:\\:" + subexp(H16$ + "\\:") + "{4}" + LS32$),
		        //[               h16 ] "::" 4( h16 ":" ) ls32
		    IPV6ADDRESS4$ = subexp(subexp(subexp(H16$ + "\\:") + "{0,1}" + H16$) + "?\\:\\:" + subexp(H16$ + "\\:") + "{3}" + LS32$),
		        //[ *1( h16 ":" ) h16 ] "::" 3( h16 ":" ) ls32
		    IPV6ADDRESS5$ = subexp(subexp(subexp(H16$ + "\\:") + "{0,2}" + H16$) + "?\\:\\:" + subexp(H16$ + "\\:") + "{2}" + LS32$),
		        //[ *2( h16 ":" ) h16 ] "::" 2( h16 ":" ) ls32
		    IPV6ADDRESS6$ = subexp(subexp(subexp(H16$ + "\\:") + "{0,3}" + H16$) + "?\\:\\:" + H16$ + "\\:" + LS32$),
		        //[ *3( h16 ":" ) h16 ] "::"    h16 ":"   ls32
		    IPV6ADDRESS7$ = subexp(subexp(subexp(H16$ + "\\:") + "{0,4}" + H16$) + "?\\:\\:" + LS32$),
		        //[ *4( h16 ":" ) h16 ] "::"              ls32
		    IPV6ADDRESS8$ = subexp(subexp(subexp(H16$ + "\\:") + "{0,5}" + H16$) + "?\\:\\:" + H16$),
		        //[ *5( h16 ":" ) h16 ] "::"              h16
		    IPV6ADDRESS9$ = subexp(subexp(subexp(H16$ + "\\:") + "{0,6}" + H16$) + "?\\:\\:"),
		        //[ *6( h16 ":" ) h16 ] "::"
		    IPV6ADDRESS$ = subexp([IPV6ADDRESS1$, IPV6ADDRESS2$, IPV6ADDRESS3$, IPV6ADDRESS4$, IPV6ADDRESS5$, IPV6ADDRESS6$, IPV6ADDRESS7$, IPV6ADDRESS8$, IPV6ADDRESS9$].join("|")),
		        ZONEID$ = subexp(subexp(UNRESERVED$$ + "|" + PCT_ENCODED$) + "+");
		        //RFC 6874, with relaxed parsing rules
		    subexp("[vV]" + HEXDIG$$ + "+\\." + merge(UNRESERVED$$, SUB_DELIMS$$, "[\\:]") + "+");
		        //RFC 6874
		    subexp(subexp(PCT_ENCODED$ + "|" + merge(UNRESERVED$$, SUB_DELIMS$$)) + "*");
		        var PCHAR$ = subexp(PCT_ENCODED$ + "|" + merge(UNRESERVED$$, SUB_DELIMS$$, "[\\:\\@]"));
		        subexp(subexp(PCT_ENCODED$ + "|" + merge(UNRESERVED$$, SUB_DELIMS$$, "[\\@]")) + "+");
		        subexp(subexp(PCHAR$ + "|" + merge("[\\/\\?]", IPRIVATE$$)) + "*");
		    return {
		        NOT_SCHEME: new RegExp(merge("[^]", ALPHA$$, DIGIT$$, "[\\+\\-\\.]"), "g"),
		        NOT_USERINFO: new RegExp(merge("[^\\%\\:]", UNRESERVED$$, SUB_DELIMS$$), "g"),
		        NOT_HOST: new RegExp(merge("[^\\%\\[\\]\\:]", UNRESERVED$$, SUB_DELIMS$$), "g"),
		        NOT_PATH: new RegExp(merge("[^\\%\\/\\:\\@]", UNRESERVED$$, SUB_DELIMS$$), "g"),
		        NOT_PATH_NOSCHEME: new RegExp(merge("[^\\%\\/\\@]", UNRESERVED$$, SUB_DELIMS$$), "g"),
		        NOT_QUERY: new RegExp(merge("[^\\%]", UNRESERVED$$, SUB_DELIMS$$, "[\\:\\@\\/\\?]", IPRIVATE$$), "g"),
		        NOT_FRAGMENT: new RegExp(merge("[^\\%]", UNRESERVED$$, SUB_DELIMS$$, "[\\:\\@\\/\\?]"), "g"),
		        ESCAPE: new RegExp(merge("[^]", UNRESERVED$$, SUB_DELIMS$$), "g"),
		        UNRESERVED: new RegExp(UNRESERVED$$, "g"),
		        OTHER_CHARS: new RegExp(merge("[^\\%]", UNRESERVED$$, RESERVED$$), "g"),
		        PCT_ENCODED: new RegExp(PCT_ENCODED$, "g"),
		        IPV4ADDRESS: new RegExp("^(" + IPV4ADDRESS$ + ")$"),
		        IPV6ADDRESS: new RegExp("^\\[?(" + IPV6ADDRESS$ + ")" + subexp(subexp("\\%25|\\%(?!" + HEXDIG$$ + "{2})") + "(" + ZONEID$ + ")") + "?\\]?$") //RFC 6874, with relaxed parsing rules
		    };
		}
		var URI_PROTOCOL = buildExps(false);

		var IRI_PROTOCOL = buildExps(true);

		var slicedToArray = function () {
		  function sliceIterator(arr, i) {
		    var _arr = [];
		    var _n = true;
		    var _d = false;
		    var _e = undefined;

		    try {
		      for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) {
		        _arr.push(_s.value);

		        if (i && _arr.length === i) break;
		      }
		    } catch (err) {
		      _d = true;
		      _e = err;
		    } finally {
		      try {
		        if (!_n && _i["return"]) _i["return"]();
		      } finally {
		        if (_d) throw _e;
		      }
		    }

		    return _arr;
		  }

		  return function (arr, i) {
		    if (Array.isArray(arr)) {
		      return arr;
		    } else if (Symbol.iterator in Object(arr)) {
		      return sliceIterator(arr, i);
		    } else {
		      throw new TypeError("Invalid attempt to destructure non-iterable instance");
		    }
		  };
		}();













		var toConsumableArray = function (arr) {
		  if (Array.isArray(arr)) {
		    for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) arr2[i] = arr[i];

		    return arr2;
		  } else {
		    return Array.from(arr);
		  }
		};

		/** Highest positive signed 32-bit float value */

		var maxInt = 2147483647; // aka. 0x7FFFFFFF or 2^31-1

		/** Bootstring parameters */
		var base = 36;
		var tMin = 1;
		var tMax = 26;
		var skew = 38;
		var damp = 700;
		var initialBias = 72;
		var initialN = 128; // 0x80
		var delimiter = '-'; // '\x2D'

		/** Regular expressions */
		var regexPunycode = /^xn--/;
		var regexNonASCII = /[^\0-\x7E]/; // non-ASCII chars
		var regexSeparators = /[\x2E\u3002\uFF0E\uFF61]/g; // RFC 3490 separators

		/** Error messages */
		var errors = {
			'overflow': 'Overflow: input needs wider integers to process',
			'not-basic': 'Illegal input >= 0x80 (not a basic code point)',
			'invalid-input': 'Invalid input'
		};

		/** Convenience shortcuts */
		var baseMinusTMin = base - tMin;
		var floor = Math.floor;
		var stringFromCharCode = String.fromCharCode;

		/*--------------------------------------------------------------------------*/

		/**
		 * A generic error utility function.
		 * @private
		 * @param {String} type The error type.
		 * @returns {Error} Throws a `RangeError` with the applicable error message.
		 */
		function error$1(type) {
			throw new RangeError(errors[type]);
		}

		/**
		 * A generic `Array#map` utility function.
		 * @private
		 * @param {Array} array The array to iterate over.
		 * @param {Function} callback The function that gets called for every array
		 * item.
		 * @returns {Array} A new array of values returned by the callback function.
		 */
		function map(array, fn) {
			var result = [];
			var length = array.length;
			while (length--) {
				result[length] = fn(array[length]);
			}
			return result;
		}

		/**
		 * A simple `Array#map`-like wrapper to work with domain name strings or email
		 * addresses.
		 * @private
		 * @param {String} domain The domain name or email address.
		 * @param {Function} callback The function that gets called for every
		 * character.
		 * @returns {Array} A new string of characters returned by the callback
		 * function.
		 */
		function mapDomain(string, fn) {
			var parts = string.split('@');
			var result = '';
			if (parts.length > 1) {
				// In email addresses, only the domain name should be punycoded. Leave
				// the local part (i.e. everything up to `@`) intact.
				result = parts[0] + '@';
				string = parts[1];
			}
			// Avoid `split(regex)` for IE8 compatibility. See #17.
			string = string.replace(regexSeparators, '\x2E');
			var labels = string.split('.');
			var encoded = map(labels, fn).join('.');
			return result + encoded;
		}

		/**
		 * Creates an array containing the numeric code points of each Unicode
		 * character in the string. While JavaScript uses UCS-2 internally,
		 * this function will convert a pair of surrogate halves (each of which
		 * UCS-2 exposes as separate characters) into a single code point,
		 * matching UTF-16.
		 * @see `punycode.ucs2.encode`
		 * @see <https://mathiasbynens.be/notes/javascript-encoding>
		 * @memberOf punycode.ucs2
		 * @name decode
		 * @param {String} string The Unicode input string (UCS-2).
		 * @returns {Array} The new array of code points.
		 */
		function ucs2decode(string) {
			var output = [];
			var counter = 0;
			var length = string.length;
			while (counter < length) {
				var value = string.charCodeAt(counter++);
				if (value >= 0xD800 && value <= 0xDBFF && counter < length) {
					// It's a high surrogate, and there is a next character.
					var extra = string.charCodeAt(counter++);
					if ((extra & 0xFC00) == 0xDC00) {
						// Low surrogate.
						output.push(((value & 0x3FF) << 10) + (extra & 0x3FF) + 0x10000);
					} else {
						// It's an unmatched surrogate; only append this code unit, in case the
						// next code unit is the high surrogate of a surrogate pair.
						output.push(value);
						counter--;
					}
				} else {
					output.push(value);
				}
			}
			return output;
		}

		/**
		 * Creates a string based on an array of numeric code points.
		 * @see `punycode.ucs2.decode`
		 * @memberOf punycode.ucs2
		 * @name encode
		 * @param {Array} codePoints The array of numeric code points.
		 * @returns {String} The new Unicode string (UCS-2).
		 */
		var ucs2encode = function ucs2encode(array) {
			return String.fromCodePoint.apply(String, toConsumableArray(array));
		};

		/**
		 * Converts a basic code point into a digit/integer.
		 * @see `digitToBasic()`
		 * @private
		 * @param {Number} codePoint The basic numeric code point value.
		 * @returns {Number} The numeric value of a basic code point (for use in
		 * representing integers) in the range `0` to `base - 1`, or `base` if
		 * the code point does not represent a value.
		 */
		var basicToDigit = function basicToDigit(codePoint) {
			if (codePoint - 0x30 < 0x0A) {
				return codePoint - 0x16;
			}
			if (codePoint - 0x41 < 0x1A) {
				return codePoint - 0x41;
			}
			if (codePoint - 0x61 < 0x1A) {
				return codePoint - 0x61;
			}
			return base;
		};

		/**
		 * Converts a digit/integer into a basic code point.
		 * @see `basicToDigit()`
		 * @private
		 * @param {Number} digit The numeric value of a basic code point.
		 * @returns {Number} The basic code point whose value (when used for
		 * representing integers) is `digit`, which needs to be in the range
		 * `0` to `base - 1`. If `flag` is non-zero, the uppercase form is
		 * used; else, the lowercase form is used. The behavior is undefined
		 * if `flag` is non-zero and `digit` has no uppercase form.
		 */
		var digitToBasic = function digitToBasic(digit, flag) {
			//  0..25 map to ASCII a..z or A..Z
			// 26..35 map to ASCII 0..9
			return digit + 22 + 75 * (digit < 26) - ((flag != 0) << 5);
		};

		/**
		 * Bias adaptation function as per section 3.4 of RFC 3492.
		 * https://tools.ietf.org/html/rfc3492#section-3.4
		 * @private
		 */
		var adapt = function adapt(delta, numPoints, firstTime) {
			var k = 0;
			delta = firstTime ? floor(delta / damp) : delta >> 1;
			delta += floor(delta / numPoints);
			for (; /* no initialization */delta > baseMinusTMin * tMax >> 1; k += base) {
				delta = floor(delta / baseMinusTMin);
			}
			return floor(k + (baseMinusTMin + 1) * delta / (delta + skew));
		};

		/**
		 * Converts a Punycode string of ASCII-only symbols to a string of Unicode
		 * symbols.
		 * @memberOf punycode
		 * @param {String} input The Punycode string of ASCII-only symbols.
		 * @returns {String} The resulting string of Unicode symbols.
		 */
		var decode = function decode(input) {
			// Don't use UCS-2.
			var output = [];
			var inputLength = input.length;
			var i = 0;
			var n = initialN;
			var bias = initialBias;

			// Handle the basic code points: let `basic` be the number of input code
			// points before the last delimiter, or `0` if there is none, then copy
			// the first basic code points to the output.

			var basic = input.lastIndexOf(delimiter);
			if (basic < 0) {
				basic = 0;
			}

			for (var j = 0; j < basic; ++j) {
				// if it's not a basic code point
				if (input.charCodeAt(j) >= 0x80) {
					error$1('not-basic');
				}
				output.push(input.charCodeAt(j));
			}

			// Main decoding loop: start just after the last delimiter if any basic code
			// points were copied; start at the beginning otherwise.

			for (var index = basic > 0 ? basic + 1 : 0; index < inputLength;) /* no final expression */{

				// `index` is the index of the next character to be consumed.
				// Decode a generalized variable-length integer into `delta`,
				// which gets added to `i`. The overflow checking is easier
				// if we increase `i` as we go, then subtract off its starting
				// value at the end to obtain `delta`.
				var oldi = i;
				for (var w = 1, k = base;; /* no condition */k += base) {

					if (index >= inputLength) {
						error$1('invalid-input');
					}

					var digit = basicToDigit(input.charCodeAt(index++));

					if (digit >= base || digit > floor((maxInt - i) / w)) {
						error$1('overflow');
					}

					i += digit * w;
					var t = k <= bias ? tMin : k >= bias + tMax ? tMax : k - bias;

					if (digit < t) {
						break;
					}

					var baseMinusT = base - t;
					if (w > floor(maxInt / baseMinusT)) {
						error$1('overflow');
					}

					w *= baseMinusT;
				}

				var out = output.length + 1;
				bias = adapt(i - oldi, out, oldi == 0);

				// `i` was supposed to wrap around from `out` to `0`,
				// incrementing `n` each time, so we'll fix that now:
				if (floor(i / out) > maxInt - n) {
					error$1('overflow');
				}

				n += floor(i / out);
				i %= out;

				// Insert `n` at position `i` of the output.
				output.splice(i++, 0, n);
			}

			return String.fromCodePoint.apply(String, output);
		};

		/**
		 * Converts a string of Unicode symbols (e.g. a domain name label) to a
		 * Punycode string of ASCII-only symbols.
		 * @memberOf punycode
		 * @param {String} input The string of Unicode symbols.
		 * @returns {String} The resulting Punycode string of ASCII-only symbols.
		 */
		var encode = function encode(input) {
			var output = [];

			// Convert the input in UCS-2 to an array of Unicode code points.
			input = ucs2decode(input);

			// Cache the length.
			var inputLength = input.length;

			// Initialize the state.
			var n = initialN;
			var delta = 0;
			var bias = initialBias;

			// Handle the basic code points.
			var _iteratorNormalCompletion = true;
			var _didIteratorError = false;
			var _iteratorError = undefined;

			try {
				for (var _iterator = input[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
					var _currentValue2 = _step.value;

					if (_currentValue2 < 0x80) {
						output.push(stringFromCharCode(_currentValue2));
					}
				}
			} catch (err) {
				_didIteratorError = true;
				_iteratorError = err;
			} finally {
				try {
					if (!_iteratorNormalCompletion && _iterator.return) {
						_iterator.return();
					}
				} finally {
					if (_didIteratorError) {
						throw _iteratorError;
					}
				}
			}

			var basicLength = output.length;
			var handledCPCount = basicLength;

			// `handledCPCount` is the number of code points that have been handled;
			// `basicLength` is the number of basic code points.

			// Finish the basic string with a delimiter unless it's empty.
			if (basicLength) {
				output.push(delimiter);
			}

			// Main encoding loop:
			while (handledCPCount < inputLength) {

				// All non-basic code points < n have been handled already. Find the next
				// larger one:
				var m = maxInt;
				var _iteratorNormalCompletion2 = true;
				var _didIteratorError2 = false;
				var _iteratorError2 = undefined;

				try {
					for (var _iterator2 = input[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
						var currentValue = _step2.value;

						if (currentValue >= n && currentValue < m) {
							m = currentValue;
						}
					}

					// Increase `delta` enough to advance the decoder's <n,i> state to <m,0>,
					// but guard against overflow.
				} catch (err) {
					_didIteratorError2 = true;
					_iteratorError2 = err;
				} finally {
					try {
						if (!_iteratorNormalCompletion2 && _iterator2.return) {
							_iterator2.return();
						}
					} finally {
						if (_didIteratorError2) {
							throw _iteratorError2;
						}
					}
				}

				var handledCPCountPlusOne = handledCPCount + 1;
				if (m - n > floor((maxInt - delta) / handledCPCountPlusOne)) {
					error$1('overflow');
				}

				delta += (m - n) * handledCPCountPlusOne;
				n = m;

				var _iteratorNormalCompletion3 = true;
				var _didIteratorError3 = false;
				var _iteratorError3 = undefined;

				try {
					for (var _iterator3 = input[Symbol.iterator](), _step3; !(_iteratorNormalCompletion3 = (_step3 = _iterator3.next()).done); _iteratorNormalCompletion3 = true) {
						var _currentValue = _step3.value;

						if (_currentValue < n && ++delta > maxInt) {
							error$1('overflow');
						}
						if (_currentValue == n) {
							// Represent delta as a generalized variable-length integer.
							var q = delta;
							for (var k = base;; /* no condition */k += base) {
								var t = k <= bias ? tMin : k >= bias + tMax ? tMax : k - bias;
								if (q < t) {
									break;
								}
								var qMinusT = q - t;
								var baseMinusT = base - t;
								output.push(stringFromCharCode(digitToBasic(t + qMinusT % baseMinusT, 0)));
								q = floor(qMinusT / baseMinusT);
							}

							output.push(stringFromCharCode(digitToBasic(q, 0)));
							bias = adapt(delta, handledCPCountPlusOne, handledCPCount == basicLength);
							delta = 0;
							++handledCPCount;
						}
					}
				} catch (err) {
					_didIteratorError3 = true;
					_iteratorError3 = err;
				} finally {
					try {
						if (!_iteratorNormalCompletion3 && _iterator3.return) {
							_iterator3.return();
						}
					} finally {
						if (_didIteratorError3) {
							throw _iteratorError3;
						}
					}
				}

				++delta;
				++n;
			}
			return output.join('');
		};

		/**
		 * Converts a Punycode string representing a domain name or an email address
		 * to Unicode. Only the Punycoded parts of the input will be converted, i.e.
		 * it doesn't matter if you call it on a string that has already been
		 * converted to Unicode.
		 * @memberOf punycode
		 * @param {String} input The Punycoded domain name or email address to
		 * convert to Unicode.
		 * @returns {String} The Unicode representation of the given Punycode
		 * string.
		 */
		var toUnicode = function toUnicode(input) {
			return mapDomain(input, function (string) {
				return regexPunycode.test(string) ? decode(string.slice(4).toLowerCase()) : string;
			});
		};

		/**
		 * Converts a Unicode string representing a domain name or an email address to
		 * Punycode. Only the non-ASCII parts of the domain name will be converted,
		 * i.e. it doesn't matter if you call it with a domain that's already in
		 * ASCII.
		 * @memberOf punycode
		 * @param {String} input The domain name or email address to convert, as a
		 * Unicode string.
		 * @returns {String} The Punycode representation of the given domain name or
		 * email address.
		 */
		var toASCII = function toASCII(input) {
			return mapDomain(input, function (string) {
				return regexNonASCII.test(string) ? 'xn--' + encode(string) : string;
			});
		};

		/*--------------------------------------------------------------------------*/

		/** Define the public API */
		var punycode = {
			/**
		  * A string representing the current Punycode.js version number.
		  * @memberOf punycode
		  * @type String
		  */
			'version': '2.1.0',
			/**
		  * An object of methods to convert from JavaScript's internal character
		  * representation (UCS-2) to Unicode code points, and back.
		  * @see <https://mathiasbynens.be/notes/javascript-encoding>
		  * @memberOf punycode
		  * @type Object
		  */
			'ucs2': {
				'decode': ucs2decode,
				'encode': ucs2encode
			},
			'decode': decode,
			'encode': encode,
			'toASCII': toASCII,
			'toUnicode': toUnicode
		};

		/**
		 * URI.js
		 *
		 * @fileoverview An RFC 3986 compliant, scheme extendable URI parsing/validating/resolving library for JavaScript.
		 * @author <a href="mailto:gary.court@gmail.com">Gary Court</a>
		 * @see http://github.com/garycourt/uri-js
		 */
		/**
		 * Copyright 2011 Gary Court. All rights reserved.
		 *
		 * Redistribution and use in source and binary forms, with or without modification, are
		 * permitted provided that the following conditions are met:
		 *
		 *    1. Redistributions of source code must retain the above copyright notice, this list of
		 *       conditions and the following disclaimer.
		 *
		 *    2. Redistributions in binary form must reproduce the above copyright notice, this list
		 *       of conditions and the following disclaimer in the documentation and/or other materials
		 *       provided with the distribution.
		 *
		 * THIS SOFTWARE IS PROVIDED BY GARY COURT ``AS IS'' AND ANY EXPRESS OR IMPLIED
		 * WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND
		 * FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL GARY COURT OR
		 * CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR
		 * CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR
		 * SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON
		 * ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING
		 * NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF
		 * ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
		 *
		 * The views and conclusions contained in the software and documentation are those of the
		 * authors and should not be interpreted as representing official policies, either expressed
		 * or implied, of Gary Court.
		 */
		var SCHEMES = {};
		function pctEncChar(chr) {
		    var c = chr.charCodeAt(0);
		    var e = void 0;
		    if (c < 16) e = "%0" + c.toString(16).toUpperCase();else if (c < 128) e = "%" + c.toString(16).toUpperCase();else if (c < 2048) e = "%" + (c >> 6 | 192).toString(16).toUpperCase() + "%" + (c & 63 | 128).toString(16).toUpperCase();else e = "%" + (c >> 12 | 224).toString(16).toUpperCase() + "%" + (c >> 6 & 63 | 128).toString(16).toUpperCase() + "%" + (c & 63 | 128).toString(16).toUpperCase();
		    return e;
		}
		function pctDecChars(str) {
		    var newStr = "";
		    var i = 0;
		    var il = str.length;
		    while (i < il) {
		        var c = parseInt(str.substr(i + 1, 2), 16);
		        if (c < 128) {
		            newStr += String.fromCharCode(c);
		            i += 3;
		        } else if (c >= 194 && c < 224) {
		            if (il - i >= 6) {
		                var c2 = parseInt(str.substr(i + 4, 2), 16);
		                newStr += String.fromCharCode((c & 31) << 6 | c2 & 63);
		            } else {
		                newStr += str.substr(i, 6);
		            }
		            i += 6;
		        } else if (c >= 224) {
		            if (il - i >= 9) {
		                var _c = parseInt(str.substr(i + 4, 2), 16);
		                var c3 = parseInt(str.substr(i + 7, 2), 16);
		                newStr += String.fromCharCode((c & 15) << 12 | (_c & 63) << 6 | c3 & 63);
		            } else {
		                newStr += str.substr(i, 9);
		            }
		            i += 9;
		        } else {
		            newStr += str.substr(i, 3);
		            i += 3;
		        }
		    }
		    return newStr;
		}
		function _normalizeComponentEncoding(components, protocol) {
		    function decodeUnreserved(str) {
		        var decStr = pctDecChars(str);
		        return !decStr.match(protocol.UNRESERVED) ? str : decStr;
		    }
		    if (components.scheme) components.scheme = String(components.scheme).replace(protocol.PCT_ENCODED, decodeUnreserved).toLowerCase().replace(protocol.NOT_SCHEME, "");
		    if (components.userinfo !== undefined) components.userinfo = String(components.userinfo).replace(protocol.PCT_ENCODED, decodeUnreserved).replace(protocol.NOT_USERINFO, pctEncChar).replace(protocol.PCT_ENCODED, toUpperCase);
		    if (components.host !== undefined) components.host = String(components.host).replace(protocol.PCT_ENCODED, decodeUnreserved).toLowerCase().replace(protocol.NOT_HOST, pctEncChar).replace(protocol.PCT_ENCODED, toUpperCase);
		    if (components.path !== undefined) components.path = String(components.path).replace(protocol.PCT_ENCODED, decodeUnreserved).replace(components.scheme ? protocol.NOT_PATH : protocol.NOT_PATH_NOSCHEME, pctEncChar).replace(protocol.PCT_ENCODED, toUpperCase);
		    if (components.query !== undefined) components.query = String(components.query).replace(protocol.PCT_ENCODED, decodeUnreserved).replace(protocol.NOT_QUERY, pctEncChar).replace(protocol.PCT_ENCODED, toUpperCase);
		    if (components.fragment !== undefined) components.fragment = String(components.fragment).replace(protocol.PCT_ENCODED, decodeUnreserved).replace(protocol.NOT_FRAGMENT, pctEncChar).replace(protocol.PCT_ENCODED, toUpperCase);
		    return components;
		}

		function _stripLeadingZeros(str) {
		    return str.replace(/^0*(.*)/, "$1") || "0";
		}
		function _normalizeIPv4(host, protocol) {
		    var matches = host.match(protocol.IPV4ADDRESS) || [];

		    var _matches = slicedToArray(matches, 2),
		        address = _matches[1];

		    if (address) {
		        return address.split(".").map(_stripLeadingZeros).join(".");
		    } else {
		        return host;
		    }
		}
		function _normalizeIPv6(host, protocol) {
		    var matches = host.match(protocol.IPV6ADDRESS) || [];

		    var _matches2 = slicedToArray(matches, 3),
		        address = _matches2[1],
		        zone = _matches2[2];

		    if (address) {
		        var _address$toLowerCase$ = address.toLowerCase().split('::').reverse(),
		            _address$toLowerCase$2 = slicedToArray(_address$toLowerCase$, 2),
		            last = _address$toLowerCase$2[0],
		            first = _address$toLowerCase$2[1];

		        var firstFields = first ? first.split(":").map(_stripLeadingZeros) : [];
		        var lastFields = last.split(":").map(_stripLeadingZeros);
		        var isLastFieldIPv4Address = protocol.IPV4ADDRESS.test(lastFields[lastFields.length - 1]);
		        var fieldCount = isLastFieldIPv4Address ? 7 : 8;
		        var lastFieldsStart = lastFields.length - fieldCount;
		        var fields = Array(fieldCount);
		        for (var x = 0; x < fieldCount; ++x) {
		            fields[x] = firstFields[x] || lastFields[lastFieldsStart + x] || '';
		        }
		        if (isLastFieldIPv4Address) {
		            fields[fieldCount - 1] = _normalizeIPv4(fields[fieldCount - 1], protocol);
		        }
		        var allZeroFields = fields.reduce(function (acc, field, index) {
		            if (!field || field === "0") {
		                var lastLongest = acc[acc.length - 1];
		                if (lastLongest && lastLongest.index + lastLongest.length === index) {
		                    lastLongest.length++;
		                } else {
		                    acc.push({ index: index, length: 1 });
		                }
		            }
		            return acc;
		        }, []);
		        var longestZeroFields = allZeroFields.sort(function (a, b) {
		            return b.length - a.length;
		        })[0];
		        var newHost = void 0;
		        if (longestZeroFields && longestZeroFields.length > 1) {
		            var newFirst = fields.slice(0, longestZeroFields.index);
		            var newLast = fields.slice(longestZeroFields.index + longestZeroFields.length);
		            newHost = newFirst.join(":") + "::" + newLast.join(":");
		        } else {
		            newHost = fields.join(":");
		        }
		        if (zone) {
		            newHost += "%" + zone;
		        }
		        return newHost;
		    } else {
		        return host;
		    }
		}
		var URI_PARSE = /^(?:([^:\/?#]+):)?(?:\/\/((?:([^\/?#@]*)@)?(\[[^\/?#\]]+\]|[^\/?#:]*)(?:\:(\d*))?))?([^?#]*)(?:\?([^#]*))?(?:#((?:.|\n|\r)*))?/i;
		var NO_MATCH_IS_UNDEFINED = "".match(/(){0}/)[1] === undefined;
		function parse(uriString) {
		    var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

		    var components = {};
		    var protocol = options.iri !== false ? IRI_PROTOCOL : URI_PROTOCOL;
		    if (options.reference === "suffix") uriString = (options.scheme ? options.scheme + ":" : "") + "//" + uriString;
		    var matches = uriString.match(URI_PARSE);
		    if (matches) {
		        if (NO_MATCH_IS_UNDEFINED) {
		            //store each component
		            components.scheme = matches[1];
		            components.userinfo = matches[3];
		            components.host = matches[4];
		            components.port = parseInt(matches[5], 10);
		            components.path = matches[6] || "";
		            components.query = matches[7];
		            components.fragment = matches[8];
		            //fix port number
		            if (isNaN(components.port)) {
		                components.port = matches[5];
		            }
		        } else {
		            //IE FIX for improper RegExp matching
		            //store each component
		            components.scheme = matches[1] || undefined;
		            components.userinfo = uriString.indexOf("@") !== -1 ? matches[3] : undefined;
		            components.host = uriString.indexOf("//") !== -1 ? matches[4] : undefined;
		            components.port = parseInt(matches[5], 10);
		            components.path = matches[6] || "";
		            components.query = uriString.indexOf("?") !== -1 ? matches[7] : undefined;
		            components.fragment = uriString.indexOf("#") !== -1 ? matches[8] : undefined;
		            //fix port number
		            if (isNaN(components.port)) {
		                components.port = uriString.match(/\/\/(?:.|\n)*\:(?:\/|\?|\#|$)/) ? matches[4] : undefined;
		            }
		        }
		        if (components.host) {
		            //normalize IP hosts
		            components.host = _normalizeIPv6(_normalizeIPv4(components.host, protocol), protocol);
		        }
		        //determine reference type
		        if (components.scheme === undefined && components.userinfo === undefined && components.host === undefined && components.port === undefined && !components.path && components.query === undefined) {
		            components.reference = "same-document";
		        } else if (components.scheme === undefined) {
		            components.reference = "relative";
		        } else if (components.fragment === undefined) {
		            components.reference = "absolute";
		        } else {
		            components.reference = "uri";
		        }
		        //check for reference errors
		        if (options.reference && options.reference !== "suffix" && options.reference !== components.reference) {
		            components.error = components.error || "URI is not a " + options.reference + " reference.";
		        }
		        //find scheme handler
		        var schemeHandler = SCHEMES[(options.scheme || components.scheme || "").toLowerCase()];
		        //check if scheme can't handle IRIs
		        if (!options.unicodeSupport && (!schemeHandler || !schemeHandler.unicodeSupport)) {
		            //if host component is a domain name
		            if (components.host && (options.domainHost || schemeHandler && schemeHandler.domainHost)) {
		                //convert Unicode IDN -> ASCII IDN
		                try {
		                    components.host = punycode.toASCII(components.host.replace(protocol.PCT_ENCODED, pctDecChars).toLowerCase());
		                } catch (e) {
		                    components.error = components.error || "Host's domain name can not be converted to ASCII via punycode: " + e;
		                }
		            }
		            //convert IRI -> URI
		            _normalizeComponentEncoding(components, URI_PROTOCOL);
		        } else {
		            //normalize encodings
		            _normalizeComponentEncoding(components, protocol);
		        }
		        //perform scheme specific parsing
		        if (schemeHandler && schemeHandler.parse) {
		            schemeHandler.parse(components, options);
		        }
		    } else {
		        components.error = components.error || "URI can not be parsed.";
		    }
		    return components;
		}

		function _recomposeAuthority(components, options) {
		    var protocol = options.iri !== false ? IRI_PROTOCOL : URI_PROTOCOL;
		    var uriTokens = [];
		    if (components.userinfo !== undefined) {
		        uriTokens.push(components.userinfo);
		        uriTokens.push("@");
		    }
		    if (components.host !== undefined) {
		        //normalize IP hosts, add brackets and escape zone separator for IPv6
		        uriTokens.push(_normalizeIPv6(_normalizeIPv4(String(components.host), protocol), protocol).replace(protocol.IPV6ADDRESS, function (_, $1, $2) {
		            return "[" + $1 + ($2 ? "%25" + $2 : "") + "]";
		        }));
		    }
		    if (typeof components.port === "number" || typeof components.port === "string") {
		        uriTokens.push(":");
		        uriTokens.push(String(components.port));
		    }
		    return uriTokens.length ? uriTokens.join("") : undefined;
		}

		var RDS1 = /^\.\.?\//;
		var RDS2 = /^\/\.(\/|$)/;
		var RDS3 = /^\/\.\.(\/|$)/;
		var RDS5 = /^\/?(?:.|\n)*?(?=\/|$)/;
		function removeDotSegments(input) {
		    var output = [];
		    while (input.length) {
		        if (input.match(RDS1)) {
		            input = input.replace(RDS1, "");
		        } else if (input.match(RDS2)) {
		            input = input.replace(RDS2, "/");
		        } else if (input.match(RDS3)) {
		            input = input.replace(RDS3, "/");
		            output.pop();
		        } else if (input === "." || input === "..") {
		            input = "";
		        } else {
		            var im = input.match(RDS5);
		            if (im) {
		                var s = im[0];
		                input = input.slice(s.length);
		                output.push(s);
		            } else {
		                throw new Error("Unexpected dot segment condition");
		            }
		        }
		    }
		    return output.join("");
		}

		function serialize(components) {
		    var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

		    var protocol = options.iri ? IRI_PROTOCOL : URI_PROTOCOL;
		    var uriTokens = [];
		    //find scheme handler
		    var schemeHandler = SCHEMES[(options.scheme || components.scheme || "").toLowerCase()];
		    //perform scheme specific serialization
		    if (schemeHandler && schemeHandler.serialize) schemeHandler.serialize(components, options);
		    if (components.host) {
		        //if host component is an IPv6 address
		        if (protocol.IPV6ADDRESS.test(components.host)) ;
		        //TODO: normalize IPv6 address as per RFC 5952

		        //if host component is a domain name
		        else if (options.domainHost || schemeHandler && schemeHandler.domainHost) {
		                //convert IDN via punycode
		                try {
		                    components.host = !options.iri ? punycode.toASCII(components.host.replace(protocol.PCT_ENCODED, pctDecChars).toLowerCase()) : punycode.toUnicode(components.host);
		                } catch (e) {
		                    components.error = components.error || "Host's domain name can not be converted to " + (!options.iri ? "ASCII" : "Unicode") + " via punycode: " + e;
		                }
		            }
		    }
		    //normalize encoding
		    _normalizeComponentEncoding(components, protocol);
		    if (options.reference !== "suffix" && components.scheme) {
		        uriTokens.push(components.scheme);
		        uriTokens.push(":");
		    }
		    var authority = _recomposeAuthority(components, options);
		    if (authority !== undefined) {
		        if (options.reference !== "suffix") {
		            uriTokens.push("//");
		        }
		        uriTokens.push(authority);
		        if (components.path && components.path.charAt(0) !== "/") {
		            uriTokens.push("/");
		        }
		    }
		    if (components.path !== undefined) {
		        var s = components.path;
		        if (!options.absolutePath && (!schemeHandler || !schemeHandler.absolutePath)) {
		            s = removeDotSegments(s);
		        }
		        if (authority === undefined) {
		            s = s.replace(/^\/\//, "/%2F"); //don't allow the path to start with "//"
		        }
		        uriTokens.push(s);
		    }
		    if (components.query !== undefined) {
		        uriTokens.push("?");
		        uriTokens.push(components.query);
		    }
		    if (components.fragment !== undefined) {
		        uriTokens.push("#");
		        uriTokens.push(components.fragment);
		    }
		    return uriTokens.join(""); //merge tokens into a string
		}

		function resolveComponents(base, relative) {
		    var options = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};
		    var skipNormalization = arguments[3];

		    var target = {};
		    if (!skipNormalization) {
		        base = parse(serialize(base, options), options); //normalize base components
		        relative = parse(serialize(relative, options), options); //normalize relative components
		    }
		    options = options || {};
		    if (!options.tolerant && relative.scheme) {
		        target.scheme = relative.scheme;
		        //target.authority = relative.authority;
		        target.userinfo = relative.userinfo;
		        target.host = relative.host;
		        target.port = relative.port;
		        target.path = removeDotSegments(relative.path || "");
		        target.query = relative.query;
		    } else {
		        if (relative.userinfo !== undefined || relative.host !== undefined || relative.port !== undefined) {
		            //target.authority = relative.authority;
		            target.userinfo = relative.userinfo;
		            target.host = relative.host;
		            target.port = relative.port;
		            target.path = removeDotSegments(relative.path || "");
		            target.query = relative.query;
		        } else {
		            if (!relative.path) {
		                target.path = base.path;
		                if (relative.query !== undefined) {
		                    target.query = relative.query;
		                } else {
		                    target.query = base.query;
		                }
		            } else {
		                if (relative.path.charAt(0) === "/") {
		                    target.path = removeDotSegments(relative.path);
		                } else {
		                    if ((base.userinfo !== undefined || base.host !== undefined || base.port !== undefined) && !base.path) {
		                        target.path = "/" + relative.path;
		                    } else if (!base.path) {
		                        target.path = relative.path;
		                    } else {
		                        target.path = base.path.slice(0, base.path.lastIndexOf("/") + 1) + relative.path;
		                    }
		                    target.path = removeDotSegments(target.path);
		                }
		                target.query = relative.query;
		            }
		            //target.authority = base.authority;
		            target.userinfo = base.userinfo;
		            target.host = base.host;
		            target.port = base.port;
		        }
		        target.scheme = base.scheme;
		    }
		    target.fragment = relative.fragment;
		    return target;
		}

		function resolve(baseURI, relativeURI, options) {
		    var schemelessOptions = assign({ scheme: 'null' }, options);
		    return serialize(resolveComponents(parse(baseURI, schemelessOptions), parse(relativeURI, schemelessOptions), schemelessOptions, true), schemelessOptions);
		}

		function normalize(uri, options) {
		    if (typeof uri === "string") {
		        uri = serialize(parse(uri, options), options);
		    } else if (typeOf(uri) === "object") {
		        uri = parse(serialize(uri, options), options);
		    }
		    return uri;
		}

		function equal(uriA, uriB, options) {
		    if (typeof uriA === "string") {
		        uriA = serialize(parse(uriA, options), options);
		    } else if (typeOf(uriA) === "object") {
		        uriA = serialize(uriA, options);
		    }
		    if (typeof uriB === "string") {
		        uriB = serialize(parse(uriB, options), options);
		    } else if (typeOf(uriB) === "object") {
		        uriB = serialize(uriB, options);
		    }
		    return uriA === uriB;
		}

		function escapeComponent(str, options) {
		    return str && str.toString().replace(!options || !options.iri ? URI_PROTOCOL.ESCAPE : IRI_PROTOCOL.ESCAPE, pctEncChar);
		}

		function unescapeComponent(str, options) {
		    return str && str.toString().replace(!options || !options.iri ? URI_PROTOCOL.PCT_ENCODED : IRI_PROTOCOL.PCT_ENCODED, pctDecChars);
		}

		var handler = {
		    scheme: "http",
		    domainHost: true,
		    parse: function parse(components, options) {
		        //report missing host
		        if (!components.host) {
		            components.error = components.error || "HTTP URIs must have a host.";
		        }
		        return components;
		    },
		    serialize: function serialize(components, options) {
		        var secure = String(components.scheme).toLowerCase() === "https";
		        //normalize the default port
		        if (components.port === (secure ? 443 : 80) || components.port === "") {
		            components.port = undefined;
		        }
		        //normalize the empty path
		        if (!components.path) {
		            components.path = "/";
		        }
		        //NOTE: We do not parse query strings for HTTP URIs
		        //as WWW Form Url Encoded query strings are part of the HTML4+ spec,
		        //and not the HTTP spec.
		        return components;
		    }
		};

		var handler$1 = {
		    scheme: "https",
		    domainHost: handler.domainHost,
		    parse: handler.parse,
		    serialize: handler.serialize
		};

		function isSecure(wsComponents) {
		    return typeof wsComponents.secure === 'boolean' ? wsComponents.secure : String(wsComponents.scheme).toLowerCase() === "wss";
		}
		//RFC 6455
		var handler$2 = {
		    scheme: "ws",
		    domainHost: true,
		    parse: function parse(components, options) {
		        var wsComponents = components;
		        //indicate if the secure flag is set
		        wsComponents.secure = isSecure(wsComponents);
		        //construct resouce name
		        wsComponents.resourceName = (wsComponents.path || '/') + (wsComponents.query ? '?' + wsComponents.query : '');
		        wsComponents.path = undefined;
		        wsComponents.query = undefined;
		        return wsComponents;
		    },
		    serialize: function serialize(wsComponents, options) {
		        //normalize the default port
		        if (wsComponents.port === (isSecure(wsComponents) ? 443 : 80) || wsComponents.port === "") {
		            wsComponents.port = undefined;
		        }
		        //ensure scheme matches secure flag
		        if (typeof wsComponents.secure === 'boolean') {
		            wsComponents.scheme = wsComponents.secure ? 'wss' : 'ws';
		            wsComponents.secure = undefined;
		        }
		        //reconstruct path from resource name
		        if (wsComponents.resourceName) {
		            var _wsComponents$resourc = wsComponents.resourceName.split('?'),
		                _wsComponents$resourc2 = slicedToArray(_wsComponents$resourc, 2),
		                path = _wsComponents$resourc2[0],
		                query = _wsComponents$resourc2[1];

		            wsComponents.path = path && path !== '/' ? path : undefined;
		            wsComponents.query = query;
		            wsComponents.resourceName = undefined;
		        }
		        //forbid fragment component
		        wsComponents.fragment = undefined;
		        return wsComponents;
		    }
		};

		var handler$3 = {
		    scheme: "wss",
		    domainHost: handler$2.domainHost,
		    parse: handler$2.parse,
		    serialize: handler$2.serialize
		};

		var O = {};
		//RFC 3986
		var UNRESERVED$$ = "[A-Za-z0-9\\-\\.\\_\\~" + ("\\xA0-\\u200D\\u2010-\\u2029\\u202F-\\uD7FF\\uF900-\\uFDCF\\uFDF0-\\uFFEF" ) + "]";
		var HEXDIG$$ = "[0-9A-Fa-f]"; //case-insensitive
		var PCT_ENCODED$ = subexp(subexp("%[EFef]" + HEXDIG$$ + "%" + HEXDIG$$ + HEXDIG$$ + "%" + HEXDIG$$ + HEXDIG$$) + "|" + subexp("%[89A-Fa-f]" + HEXDIG$$ + "%" + HEXDIG$$ + HEXDIG$$) + "|" + subexp("%" + HEXDIG$$ + HEXDIG$$)); //expanded
		//RFC 5322, except these symbols as per RFC 6068: @ : / ? # [ ] & ; =
		//const ATEXT$$ = "[A-Za-z0-9\\!\\#\\$\\%\\&\\'\\*\\+\\-\\/\\=\\?\\^\\_\\`\\{\\|\\}\\~]";
		//const WSP$$ = "[\\x20\\x09]";
		//const OBS_QTEXT$$ = "[\\x01-\\x08\\x0B\\x0C\\x0E-\\x1F\\x7F]";  //(%d1-8 / %d11-12 / %d14-31 / %d127)
		//const QTEXT$$ = merge("[\\x21\\x23-\\x5B\\x5D-\\x7E]", OBS_QTEXT$$);  //%d33 / %d35-91 / %d93-126 / obs-qtext
		//const VCHAR$$ = "[\\x21-\\x7E]";
		//const WSP$$ = "[\\x20\\x09]";
		//const OBS_QP$ = subexp("\\\\" + merge("[\\x00\\x0D\\x0A]", OBS_QTEXT$$));  //%d0 / CR / LF / obs-qtext
		//const FWS$ = subexp(subexp(WSP$$ + "*" + "\\x0D\\x0A") + "?" + WSP$$ + "+");
		//const QUOTED_PAIR$ = subexp(subexp("\\\\" + subexp(VCHAR$$ + "|" + WSP$$)) + "|" + OBS_QP$);
		//const QUOTED_STRING$ = subexp('\\"' + subexp(FWS$ + "?" + QCONTENT$) + "*" + FWS$ + "?" + '\\"');
		var ATEXT$$ = "[A-Za-z0-9\\!\\$\\%\\'\\*\\+\\-\\^\\_\\`\\{\\|\\}\\~]";
		var QTEXT$$ = "[\\!\\$\\%\\'\\(\\)\\*\\+\\,\\-\\.0-9\\<\\>A-Z\\x5E-\\x7E]";
		var VCHAR$$ = merge(QTEXT$$, "[\\\"\\\\]");
		var SOME_DELIMS$$ = "[\\!\\$\\'\\(\\)\\*\\+\\,\\;\\:\\@]";
		var UNRESERVED = new RegExp(UNRESERVED$$, "g");
		var PCT_ENCODED = new RegExp(PCT_ENCODED$, "g");
		var NOT_LOCAL_PART = new RegExp(merge("[^]", ATEXT$$, "[\\.]", '[\\"]', VCHAR$$), "g");
		var NOT_HFNAME = new RegExp(merge("[^]", UNRESERVED$$, SOME_DELIMS$$), "g");
		var NOT_HFVALUE = NOT_HFNAME;
		function decodeUnreserved(str) {
		    var decStr = pctDecChars(str);
		    return !decStr.match(UNRESERVED) ? str : decStr;
		}
		var handler$4 = {
		    scheme: "mailto",
		    parse: function parse$$1(components, options) {
		        var mailtoComponents = components;
		        var to = mailtoComponents.to = mailtoComponents.path ? mailtoComponents.path.split(",") : [];
		        mailtoComponents.path = undefined;
		        if (mailtoComponents.query) {
		            var unknownHeaders = false;
		            var headers = {};
		            var hfields = mailtoComponents.query.split("&");
		            for (var x = 0, xl = hfields.length; x < xl; ++x) {
		                var hfield = hfields[x].split("=");
		                switch (hfield[0]) {
		                    case "to":
		                        var toAddrs = hfield[1].split(",");
		                        for (var _x = 0, _xl = toAddrs.length; _x < _xl; ++_x) {
		                            to.push(toAddrs[_x]);
		                        }
		                        break;
		                    case "subject":
		                        mailtoComponents.subject = unescapeComponent(hfield[1], options);
		                        break;
		                    case "body":
		                        mailtoComponents.body = unescapeComponent(hfield[1], options);
		                        break;
		                    default:
		                        unknownHeaders = true;
		                        headers[unescapeComponent(hfield[0], options)] = unescapeComponent(hfield[1], options);
		                        break;
		                }
		            }
		            if (unknownHeaders) mailtoComponents.headers = headers;
		        }
		        mailtoComponents.query = undefined;
		        for (var _x2 = 0, _xl2 = to.length; _x2 < _xl2; ++_x2) {
		            var addr = to[_x2].split("@");
		            addr[0] = unescapeComponent(addr[0]);
		            if (!options.unicodeSupport) {
		                //convert Unicode IDN -> ASCII IDN
		                try {
		                    addr[1] = punycode.toASCII(unescapeComponent(addr[1], options).toLowerCase());
		                } catch (e) {
		                    mailtoComponents.error = mailtoComponents.error || "Email address's domain name can not be converted to ASCII via punycode: " + e;
		                }
		            } else {
		                addr[1] = unescapeComponent(addr[1], options).toLowerCase();
		            }
		            to[_x2] = addr.join("@");
		        }
		        return mailtoComponents;
		    },
		    serialize: function serialize$$1(mailtoComponents, options) {
		        var components = mailtoComponents;
		        var to = toArray(mailtoComponents.to);
		        if (to) {
		            for (var x = 0, xl = to.length; x < xl; ++x) {
		                var toAddr = String(to[x]);
		                var atIdx = toAddr.lastIndexOf("@");
		                var localPart = toAddr.slice(0, atIdx).replace(PCT_ENCODED, decodeUnreserved).replace(PCT_ENCODED, toUpperCase).replace(NOT_LOCAL_PART, pctEncChar);
		                var domain = toAddr.slice(atIdx + 1);
		                //convert IDN via punycode
		                try {
		                    domain = !options.iri ? punycode.toASCII(unescapeComponent(domain, options).toLowerCase()) : punycode.toUnicode(domain);
		                } catch (e) {
		                    components.error = components.error || "Email address's domain name can not be converted to " + (!options.iri ? "ASCII" : "Unicode") + " via punycode: " + e;
		                }
		                to[x] = localPart + "@" + domain;
		            }
		            components.path = to.join(",");
		        }
		        var headers = mailtoComponents.headers = mailtoComponents.headers || {};
		        if (mailtoComponents.subject) headers["subject"] = mailtoComponents.subject;
		        if (mailtoComponents.body) headers["body"] = mailtoComponents.body;
		        var fields = [];
		        for (var name in headers) {
		            if (headers[name] !== O[name]) {
		                fields.push(name.replace(PCT_ENCODED, decodeUnreserved).replace(PCT_ENCODED, toUpperCase).replace(NOT_HFNAME, pctEncChar) + "=" + headers[name].replace(PCT_ENCODED, decodeUnreserved).replace(PCT_ENCODED, toUpperCase).replace(NOT_HFVALUE, pctEncChar));
		            }
		        }
		        if (fields.length) {
		            components.query = fields.join("&");
		        }
		        return components;
		    }
		};

		var URN_PARSE = /^([^\:]+)\:(.*)/;
		//RFC 2141
		var handler$5 = {
		    scheme: "urn",
		    parse: function parse$$1(components, options) {
		        var matches = components.path && components.path.match(URN_PARSE);
		        var urnComponents = components;
		        if (matches) {
		            var scheme = options.scheme || urnComponents.scheme || "urn";
		            var nid = matches[1].toLowerCase();
		            var nss = matches[2];
		            var urnScheme = scheme + ":" + (options.nid || nid);
		            var schemeHandler = SCHEMES[urnScheme];
		            urnComponents.nid = nid;
		            urnComponents.nss = nss;
		            urnComponents.path = undefined;
		            if (schemeHandler) {
		                urnComponents = schemeHandler.parse(urnComponents, options);
		            }
		        } else {
		            urnComponents.error = urnComponents.error || "URN can not be parsed.";
		        }
		        return urnComponents;
		    },
		    serialize: function serialize$$1(urnComponents, options) {
		        var scheme = options.scheme || urnComponents.scheme || "urn";
		        var nid = urnComponents.nid;
		        var urnScheme = scheme + ":" + (options.nid || nid);
		        var schemeHandler = SCHEMES[urnScheme];
		        if (schemeHandler) {
		            urnComponents = schemeHandler.serialize(urnComponents, options);
		        }
		        var uriComponents = urnComponents;
		        var nss = urnComponents.nss;
		        uriComponents.path = (nid || options.nid) + ":" + nss;
		        return uriComponents;
		    }
		};

		var UUID = /^[0-9A-Fa-f]{8}(?:\-[0-9A-Fa-f]{4}){3}\-[0-9A-Fa-f]{12}$/;
		//RFC 4122
		var handler$6 = {
		    scheme: "urn:uuid",
		    parse: function parse(urnComponents, options) {
		        var uuidComponents = urnComponents;
		        uuidComponents.uuid = uuidComponents.nss;
		        uuidComponents.nss = undefined;
		        if (!options.tolerant && (!uuidComponents.uuid || !uuidComponents.uuid.match(UUID))) {
		            uuidComponents.error = uuidComponents.error || "UUID is not valid.";
		        }
		        return uuidComponents;
		    },
		    serialize: function serialize(uuidComponents, options) {
		        var urnComponents = uuidComponents;
		        //normalize UUID
		        urnComponents.nss = (uuidComponents.uuid || "").toLowerCase();
		        return urnComponents;
		    }
		};

		SCHEMES[handler.scheme] = handler;
		SCHEMES[handler$1.scheme] = handler$1;
		SCHEMES[handler$2.scheme] = handler$2;
		SCHEMES[handler$3.scheme] = handler$3;
		SCHEMES[handler$4.scheme] = handler$4;
		SCHEMES[handler$5.scheme] = handler$5;
		SCHEMES[handler$6.scheme] = handler$6;

		exports.SCHEMES = SCHEMES;
		exports.pctEncChar = pctEncChar;
		exports.pctDecChars = pctDecChars;
		exports.parse = parse;
		exports.removeDotSegments = removeDotSegments;
		exports.serialize = serialize;
		exports.resolveComponents = resolveComponents;
		exports.resolve = resolve;
		exports.normalize = normalize;
		exports.equal = equal;
		exports.escapeComponent = escapeComponent;
		exports.unescapeComponent = unescapeComponent;

		Object.defineProperty(exports, '__esModule', { value: true });

		})));
		
	} (uri_all$1, uri_all$1.exports));
	return uri_all$1.exports;
}

var fastDeepEqual;
var hasRequiredFastDeepEqual;

function requireFastDeepEqual () {
	if (hasRequiredFastDeepEqual) return fastDeepEqual;
	hasRequiredFastDeepEqual = 1;

	// do not edit .js files directly - edit src/index.jst



	fastDeepEqual = function equal(a, b) {
	  if (a === b) return true;

	  if (a && b && typeof a == 'object' && typeof b == 'object') {
	    if (a.constructor !== b.constructor) return false;

	    var length, i, keys;
	    if (Array.isArray(a)) {
	      length = a.length;
	      if (length != b.length) return false;
	      for (i = length; i-- !== 0;)
	        if (!equal(a[i], b[i])) return false;
	      return true;
	    }



	    if (a.constructor === RegExp) return a.source === b.source && a.flags === b.flags;
	    if (a.valueOf !== Object.prototype.valueOf) return a.valueOf() === b.valueOf();
	    if (a.toString !== Object.prototype.toString) return a.toString() === b.toString();

	    keys = Object.keys(a);
	    length = keys.length;
	    if (length !== Object.keys(b).length) return false;

	    for (i = length; i-- !== 0;)
	      if (!Object.prototype.hasOwnProperty.call(b, keys[i])) return false;

	    for (i = length; i-- !== 0;) {
	      var key = keys[i];

	      if (!equal(a[key], b[key])) return false;
	    }

	    return true;
	  }

	  // true if both NaN, false otherwise
	  return a!==a && b!==b;
	};
	return fastDeepEqual;
}

var ucs2length;
var hasRequiredUcs2length;

function requireUcs2length () {
	if (hasRequiredUcs2length) return ucs2length;
	hasRequiredUcs2length = 1;

	// https://mathiasbynens.be/notes/javascript-encoding
	// https://github.com/bestiejs/punycode.js - punycode.ucs2.decode
	ucs2length = function ucs2length(str) {
	  var length = 0
	    , len = str.length
	    , pos = 0
	    , value;
	  while (pos < len) {
	    length++;
	    value = str.charCodeAt(pos++);
	    if (value >= 0xD800 && value <= 0xDBFF && pos < len) {
	      // high surrogate, and there is a next character
	      value = str.charCodeAt(pos);
	      if ((value & 0xFC00) == 0xDC00) pos++; // low surrogate
	    }
	  }
	  return length;
	};
	return ucs2length;
}

var util;
var hasRequiredUtil;

function requireUtil () {
	if (hasRequiredUtil) return util;
	hasRequiredUtil = 1;


	util = {
	  copy: copy,
	  checkDataType: checkDataType,
	  checkDataTypes: checkDataTypes,
	  coerceToTypes: coerceToTypes,
	  toHash: toHash,
	  getProperty: getProperty,
	  escapeQuotes: escapeQuotes,
	  equal: requireFastDeepEqual(),
	  ucs2length: requireUcs2length(),
	  varOccurences: varOccurences,
	  varReplace: varReplace,
	  schemaHasRules: schemaHasRules,
	  schemaHasRulesExcept: schemaHasRulesExcept,
	  schemaUnknownRules: schemaUnknownRules,
	  toQuotedString: toQuotedString,
	  getPathExpr: getPathExpr,
	  getPath: getPath,
	  getData: getData,
	  unescapeFragment: unescapeFragment,
	  unescapeJsonPointer: unescapeJsonPointer,
	  escapeFragment: escapeFragment,
	  escapeJsonPointer: escapeJsonPointer
	};


	function copy(o, to) {
	  to = to || {};
	  for (var key in o) to[key] = o[key];
	  return to;
	}


	function checkDataType(dataType, data, strictNumbers, negate) {
	  var EQUAL = negate ? ' !== ' : ' === '
	    , AND = negate ? ' || ' : ' && '
	    , OK = negate ? '!' : ''
	    , NOT = negate ? '' : '!';
	  switch (dataType) {
	    case 'null': return data + EQUAL + 'null';
	    case 'array': return OK + 'Array.isArray(' + data + ')';
	    case 'object': return '(' + OK + data + AND +
	                          'typeof ' + data + EQUAL + '"object"' + AND +
	                          NOT + 'Array.isArray(' + data + '))';
	    case 'integer': return '(typeof ' + data + EQUAL + '"number"' + AND +
	                           NOT + '(' + data + ' % 1)' +
	                           AND + data + EQUAL + data +
	                           (strictNumbers ? (AND + OK + 'isFinite(' + data + ')') : '') + ')';
	    case 'number': return '(typeof ' + data + EQUAL + '"' + dataType + '"' +
	                          (strictNumbers ? (AND + OK + 'isFinite(' + data + ')') : '') + ')';
	    default: return 'typeof ' + data + EQUAL + '"' + dataType + '"';
	  }
	}


	function checkDataTypes(dataTypes, data, strictNumbers) {
	  switch (dataTypes.length) {
	    case 1: return checkDataType(dataTypes[0], data, strictNumbers, true);
	    default:
	      var code = '';
	      var types = toHash(dataTypes);
	      if (types.array && types.object) {
	        code = types.null ? '(': '(!' + data + ' || ';
	        code += 'typeof ' + data + ' !== "object")';
	        delete types.null;
	        delete types.array;
	        delete types.object;
	      }
	      if (types.number) delete types.integer;
	      for (var t in types)
	        code += (code ? ' && ' : '' ) + checkDataType(t, data, strictNumbers, true);

	      return code;
	  }
	}


	var COERCE_TO_TYPES = toHash([ 'string', 'number', 'integer', 'boolean', 'null' ]);
	function coerceToTypes(optionCoerceTypes, dataTypes) {
	  if (Array.isArray(dataTypes)) {
	    var types = [];
	    for (var i=0; i<dataTypes.length; i++) {
	      var t = dataTypes[i];
	      if (COERCE_TO_TYPES[t]) types[types.length] = t;
	      else if (optionCoerceTypes === 'array' && t === 'array') types[types.length] = t;
	    }
	    if (types.length) return types;
	  } else if (COERCE_TO_TYPES[dataTypes]) {
	    return [dataTypes];
	  } else if (optionCoerceTypes === 'array' && dataTypes === 'array') {
	    return ['array'];
	  }
	}


	function toHash(arr) {
	  var hash = {};
	  for (var i=0; i<arr.length; i++) hash[arr[i]] = true;
	  return hash;
	}


	var IDENTIFIER = /^[a-z$_][a-z$_0-9]*$/i;
	var SINGLE_QUOTE = /'|\\/g;
	function getProperty(key) {
	  return typeof key == 'number'
	          ? '[' + key + ']'
	          : IDENTIFIER.test(key)
	            ? '.' + key
	            : "['" + escapeQuotes(key) + "']";
	}


	function escapeQuotes(str) {
	  return str.replace(SINGLE_QUOTE, '\\$&')
	            .replace(/\n/g, '\\n')
	            .replace(/\r/g, '\\r')
	            .replace(/\f/g, '\\f')
	            .replace(/\t/g, '\\t');
	}


	function varOccurences(str, dataVar) {
	  dataVar += '[^0-9]';
	  var matches = str.match(new RegExp(dataVar, 'g'));
	  return matches ? matches.length : 0;
	}


	function varReplace(str, dataVar, expr) {
	  dataVar += '([^0-9])';
	  expr = expr.replace(/\$/g, '$$$$');
	  return str.replace(new RegExp(dataVar, 'g'), expr + '$1');
	}


	function schemaHasRules(schema, rules) {
	  if (typeof schema == 'boolean') return !schema;
	  for (var key in schema) if (rules[key]) return true;
	}


	function schemaHasRulesExcept(schema, rules, exceptKeyword) {
	  if (typeof schema == 'boolean') return !schema && exceptKeyword != 'not';
	  for (var key in schema) if (key != exceptKeyword && rules[key]) return true;
	}


	function schemaUnknownRules(schema, rules) {
	  if (typeof schema == 'boolean') return;
	  for (var key in schema) if (!rules[key]) return key;
	}


	function toQuotedString(str) {
	  return '\'' + escapeQuotes(str) + '\'';
	}


	function getPathExpr(currentPath, expr, jsonPointers, isNumber) {
	  var path = jsonPointers // false by default
	              ? '\'/\' + ' + expr + (isNumber ? '' : '.replace(/~/g, \'~0\').replace(/\\//g, \'~1\')')
	              : (isNumber ? '\'[\' + ' + expr + ' + \']\'' : '\'[\\\'\' + ' + expr + ' + \'\\\']\'');
	  return joinPaths(currentPath, path);
	}


	function getPath(currentPath, prop, jsonPointers) {
	  var path = jsonPointers // false by default
	              ? toQuotedString('/' + escapeJsonPointer(prop))
	              : toQuotedString(getProperty(prop));
	  return joinPaths(currentPath, path);
	}


	var JSON_POINTER = /^\/(?:[^~]|~0|~1)*$/;
	var RELATIVE_JSON_POINTER = /^([0-9]+)(#|\/(?:[^~]|~0|~1)*)?$/;
	function getData($data, lvl, paths) {
	  var up, jsonPointer, data, matches;
	  if ($data === '') return 'rootData';
	  if ($data[0] == '/') {
	    if (!JSON_POINTER.test($data)) throw new Error('Invalid JSON-pointer: ' + $data);
	    jsonPointer = $data;
	    data = 'rootData';
	  } else {
	    matches = $data.match(RELATIVE_JSON_POINTER);
	    if (!matches) throw new Error('Invalid JSON-pointer: ' + $data);
	    up = +matches[1];
	    jsonPointer = matches[2];
	    if (jsonPointer == '#') {
	      if (up >= lvl) throw new Error('Cannot access property/index ' + up + ' levels up, current level is ' + lvl);
	      return paths[lvl - up];
	    }

	    if (up > lvl) throw new Error('Cannot access data ' + up + ' levels up, current level is ' + lvl);
	    data = 'data' + ((lvl - up) || '');
	    if (!jsonPointer) return data;
	  }

	  var expr = data;
	  var segments = jsonPointer.split('/');
	  for (var i=0; i<segments.length; i++) {
	    var segment = segments[i];
	    if (segment) {
	      data += getProperty(unescapeJsonPointer(segment));
	      expr += ' && ' + data;
	    }
	  }
	  return expr;
	}


	function joinPaths (a, b) {
	  if (a == '""') return b;
	  return (a + ' + ' + b).replace(/([^\\])' \+ '/g, '$1');
	}


	function unescapeFragment(str) {
	  return unescapeJsonPointer(decodeURIComponent(str));
	}


	function escapeFragment(str) {
	  return encodeURIComponent(escapeJsonPointer(str));
	}


	function escapeJsonPointer(str) {
	  return str.replace(/~/g, '~0').replace(/\//g, '~1');
	}


	function unescapeJsonPointer(str) {
	  return str.replace(/~1/g, '/').replace(/~0/g, '~');
	}
	return util;
}

var schema_obj;
var hasRequiredSchema_obj;

function requireSchema_obj () {
	if (hasRequiredSchema_obj) return schema_obj;
	hasRequiredSchema_obj = 1;

	var util = requireUtil();

	schema_obj = SchemaObject;

	function SchemaObject(obj) {
	  util.copy(obj, this);
	}
	return schema_obj;
}

var jsonSchemaTraverse = {exports: {}};

var hasRequiredJsonSchemaTraverse;

function requireJsonSchemaTraverse () {
	if (hasRequiredJsonSchemaTraverse) return jsonSchemaTraverse.exports;
	hasRequiredJsonSchemaTraverse = 1;

	var traverse = jsonSchemaTraverse.exports = function (schema, opts, cb) {
	  // Legacy support for v0.3.1 and earlier.
	  if (typeof opts == 'function') {
	    cb = opts;
	    opts = {};
	  }

	  cb = opts.cb || cb;
	  var pre = (typeof cb == 'function') ? cb : cb.pre || function() {};
	  var post = cb.post || function() {};

	  _traverse(opts, pre, post, schema, '', schema);
	};


	traverse.keywords = {
	  additionalItems: true,
	  items: true,
	  contains: true,
	  additionalProperties: true,
	  propertyNames: true,
	  not: true
	};

	traverse.arrayKeywords = {
	  items: true,
	  allOf: true,
	  anyOf: true,
	  oneOf: true
	};

	traverse.propsKeywords = {
	  definitions: true,
	  properties: true,
	  patternProperties: true,
	  dependencies: true
	};

	traverse.skipKeywords = {
	  default: true,
	  enum: true,
	  const: true,
	  required: true,
	  maximum: true,
	  minimum: true,
	  exclusiveMaximum: true,
	  exclusiveMinimum: true,
	  multipleOf: true,
	  maxLength: true,
	  minLength: true,
	  pattern: true,
	  format: true,
	  maxItems: true,
	  minItems: true,
	  uniqueItems: true,
	  maxProperties: true,
	  minProperties: true
	};


	function _traverse(opts, pre, post, schema, jsonPtr, rootSchema, parentJsonPtr, parentKeyword, parentSchema, keyIndex) {
	  if (schema && typeof schema == 'object' && !Array.isArray(schema)) {
	    pre(schema, jsonPtr, rootSchema, parentJsonPtr, parentKeyword, parentSchema, keyIndex);
	    for (var key in schema) {
	      var sch = schema[key];
	      if (Array.isArray(sch)) {
	        if (key in traverse.arrayKeywords) {
	          for (var i=0; i<sch.length; i++)
	            _traverse(opts, pre, post, sch[i], jsonPtr + '/' + key + '/' + i, rootSchema, jsonPtr, key, schema, i);
	        }
	      } else if (key in traverse.propsKeywords) {
	        if (sch && typeof sch == 'object') {
	          for (var prop in sch)
	            _traverse(opts, pre, post, sch[prop], jsonPtr + '/' + key + '/' + escapeJsonPtr(prop), rootSchema, jsonPtr, key, schema, prop);
	        }
	      } else if (key in traverse.keywords || (opts.allKeys && !(key in traverse.skipKeywords))) {
	        _traverse(opts, pre, post, sch, jsonPtr + '/' + key, rootSchema, jsonPtr, key, schema);
	      }
	    }
	    post(schema, jsonPtr, rootSchema, parentJsonPtr, parentKeyword, parentSchema, keyIndex);
	  }
	}


	function escapeJsonPtr(str) {
	  return str.replace(/~/g, '~0').replace(/\//g, '~1');
	}
	return jsonSchemaTraverse.exports;
}

var resolve_1;
var hasRequiredResolve;

function requireResolve () {
	if (hasRequiredResolve) return resolve_1;
	hasRequiredResolve = 1;

	var URI = requireUri_all()
	  , equal = requireFastDeepEqual()
	  , util = requireUtil()
	  , SchemaObject = requireSchema_obj()
	  , traverse = requireJsonSchemaTraverse();

	resolve_1 = resolve;

	resolve.normalizeId = normalizeId;
	resolve.fullPath = getFullPath;
	resolve.url = resolveUrl;
	resolve.ids = resolveIds;
	resolve.inlineRef = inlineRef;
	resolve.schema = resolveSchema;

	/**
	 * [resolve and compile the references ($ref)]
	 * @this   Ajv
	 * @param  {Function} compile reference to schema compilation funciton (localCompile)
	 * @param  {Object} root object with information about the root schema for the current schema
	 * @param  {String} ref reference to resolve
	 * @return {Object|Function} schema object (if the schema can be inlined) or validation function
	 */
	function resolve(compile, root, ref) {
	  /* jshint validthis: true */
	  var refVal = this._refs[ref];
	  if (typeof refVal == 'string') {
	    if (this._refs[refVal]) refVal = this._refs[refVal];
	    else return resolve.call(this, compile, root, refVal);
	  }

	  refVal = refVal || this._schemas[ref];
	  if (refVal instanceof SchemaObject) {
	    return inlineRef(refVal.schema, this._opts.inlineRefs)
	            ? refVal.schema
	            : refVal.validate || this._compile(refVal);
	  }

	  var res = resolveSchema.call(this, root, ref);
	  var schema, v, baseId;
	  if (res) {
	    schema = res.schema;
	    root = res.root;
	    baseId = res.baseId;
	  }

	  if (schema instanceof SchemaObject) {
	    v = schema.validate || compile.call(this, schema.schema, root, undefined, baseId);
	  } else if (schema !== undefined) {
	    v = inlineRef(schema, this._opts.inlineRefs)
	        ? schema
	        : compile.call(this, schema, root, undefined, baseId);
	  }

	  return v;
	}


	/**
	 * Resolve schema, its root and baseId
	 * @this Ajv
	 * @param  {Object} root root object with properties schema, refVal, refs
	 * @param  {String} ref  reference to resolve
	 * @return {Object} object with properties schema, root, baseId
	 */
	function resolveSchema(root, ref) {
	  /* jshint validthis: true */
	  var p = URI.parse(ref)
	    , refPath = _getFullPath(p)
	    , baseId = getFullPath(this._getId(root.schema));
	  if (Object.keys(root.schema).length === 0 || refPath !== baseId) {
	    var id = normalizeId(refPath);
	    var refVal = this._refs[id];
	    if (typeof refVal == 'string') {
	      return resolveRecursive.call(this, root, refVal, p);
	    } else if (refVal instanceof SchemaObject) {
	      if (!refVal.validate) this._compile(refVal);
	      root = refVal;
	    } else {
	      refVal = this._schemas[id];
	      if (refVal instanceof SchemaObject) {
	        if (!refVal.validate) this._compile(refVal);
	        if (id == normalizeId(ref))
	          return { schema: refVal, root: root, baseId: baseId };
	        root = refVal;
	      } else {
	        return;
	      }
	    }
	    if (!root.schema) return;
	    baseId = getFullPath(this._getId(root.schema));
	  }
	  return getJsonPointer.call(this, p, baseId, root.schema, root);
	}


	/* @this Ajv */
	function resolveRecursive(root, ref, parsedRef) {
	  /* jshint validthis: true */
	  var res = resolveSchema.call(this, root, ref);
	  if (res) {
	    var schema = res.schema;
	    var baseId = res.baseId;
	    root = res.root;
	    var id = this._getId(schema);
	    if (id) baseId = resolveUrl(baseId, id);
	    return getJsonPointer.call(this, parsedRef, baseId, schema, root);
	  }
	}


	var PREVENT_SCOPE_CHANGE = util.toHash(['properties', 'patternProperties', 'enum', 'dependencies', 'definitions']);
	/* @this Ajv */
	function getJsonPointer(parsedRef, baseId, schema, root) {
	  /* jshint validthis: true */
	  parsedRef.fragment = parsedRef.fragment || '';
	  if (parsedRef.fragment.slice(0,1) != '/') return;
	  var parts = parsedRef.fragment.split('/');

	  for (var i = 1; i < parts.length; i++) {
	    var part = parts[i];
	    if (part) {
	      part = util.unescapeFragment(part);
	      schema = schema[part];
	      if (schema === undefined) break;
	      var id;
	      if (!PREVENT_SCOPE_CHANGE[part]) {
	        id = this._getId(schema);
	        if (id) baseId = resolveUrl(baseId, id);
	        if (schema.$ref) {
	          var $ref = resolveUrl(baseId, schema.$ref);
	          var res = resolveSchema.call(this, root, $ref);
	          if (res) {
	            schema = res.schema;
	            root = res.root;
	            baseId = res.baseId;
	          }
	        }
	      }
	    }
	  }
	  if (schema !== undefined && schema !== root.schema)
	    return { schema: schema, root: root, baseId: baseId };
	}


	var SIMPLE_INLINED = util.toHash([
	  'type', 'format', 'pattern',
	  'maxLength', 'minLength',
	  'maxProperties', 'minProperties',
	  'maxItems', 'minItems',
	  'maximum', 'minimum',
	  'uniqueItems', 'multipleOf',
	  'required', 'enum'
	]);
	function inlineRef(schema, limit) {
	  if (limit === false) return false;
	  if (limit === undefined || limit === true) return checkNoRef(schema);
	  else if (limit) return countKeys(schema) <= limit;
	}


	function checkNoRef(schema) {
	  var item;
	  if (Array.isArray(schema)) {
	    for (var i=0; i<schema.length; i++) {
	      item = schema[i];
	      if (typeof item == 'object' && !checkNoRef(item)) return false;
	    }
	  } else {
	    for (var key in schema) {
	      if (key == '$ref') return false;
	      item = schema[key];
	      if (typeof item == 'object' && !checkNoRef(item)) return false;
	    }
	  }
	  return true;
	}


	function countKeys(schema) {
	  var count = 0, item;
	  if (Array.isArray(schema)) {
	    for (var i=0; i<schema.length; i++) {
	      item = schema[i];
	      if (typeof item == 'object') count += countKeys(item);
	      if (count == Infinity) return Infinity;
	    }
	  } else {
	    for (var key in schema) {
	      if (key == '$ref') return Infinity;
	      if (SIMPLE_INLINED[key]) {
	        count++;
	      } else {
	        item = schema[key];
	        if (typeof item == 'object') count += countKeys(item) + 1;
	        if (count == Infinity) return Infinity;
	      }
	    }
	  }
	  return count;
	}


	function getFullPath(id, normalize) {
	  if (normalize !== false) id = normalizeId(id);
	  var p = URI.parse(id);
	  return _getFullPath(p);
	}


	function _getFullPath(p) {
	  return URI.serialize(p).split('#')[0] + '#';
	}


	var TRAILING_SLASH_HASH = /#\/?$/;
	function normalizeId(id) {
	  return id ? id.replace(TRAILING_SLASH_HASH, '') : '';
	}


	function resolveUrl(baseId, id) {
	  id = normalizeId(id);
	  return URI.resolve(baseId, id);
	}


	/* @this Ajv */
	function resolveIds(schema) {
	  var schemaId = normalizeId(this._getId(schema));
	  var baseIds = {'': schemaId};
	  var fullPaths = {'': getFullPath(schemaId, false)};
	  var localRefs = {};
	  var self = this;

	  traverse(schema, {allKeys: true}, function(sch, jsonPtr, rootSchema, parentJsonPtr, parentKeyword, parentSchema, keyIndex) {
	    if (jsonPtr === '') return;
	    var id = self._getId(sch);
	    var baseId = baseIds[parentJsonPtr];
	    var fullPath = fullPaths[parentJsonPtr] + '/' + parentKeyword;
	    if (keyIndex !== undefined)
	      fullPath += '/' + (typeof keyIndex == 'number' ? keyIndex : util.escapeFragment(keyIndex));

	    if (typeof id == 'string') {
	      id = baseId = normalizeId(baseId ? URI.resolve(baseId, id) : id);

	      var refVal = self._refs[id];
	      if (typeof refVal == 'string') refVal = self._refs[refVal];
	      if (refVal && refVal.schema) {
	        if (!equal(sch, refVal.schema))
	          throw new Error('id "' + id + '" resolves to more than one schema');
	      } else if (id != normalizeId(fullPath)) {
	        if (id[0] == '#') {
	          if (localRefs[id] && !equal(sch, localRefs[id]))
	            throw new Error('id "' + id + '" resolves to more than one schema');
	          localRefs[id] = sch;
	        } else {
	          self._refs[id] = fullPath;
	        }
	      }
	    }
	    baseIds[jsonPtr] = baseId;
	    fullPaths[jsonPtr] = fullPath;
	  });

	  return localRefs;
	}
	return resolve_1;
}

var error_classes;
var hasRequiredError_classes;

function requireError_classes () {
	if (hasRequiredError_classes) return error_classes;
	hasRequiredError_classes = 1;

	var resolve = requireResolve();

	error_classes = {
	  Validation: errorSubclass(ValidationError),
	  MissingRef: errorSubclass(MissingRefError)
	};


	function ValidationError(errors) {
	  this.message = 'validation failed';
	  this.errors = errors;
	  this.ajv = this.validation = true;
	}


	MissingRefError.message = function (baseId, ref) {
	  return 'can\'t resolve reference ' + ref + ' from id ' + baseId;
	};


	function MissingRefError(baseId, ref, message) {
	  this.message = message || MissingRefError.message(baseId, ref);
	  this.missingRef = resolve.url(baseId, ref);
	  this.missingSchema = resolve.normalizeId(resolve.fullPath(this.missingRef));
	}


	function errorSubclass(Subclass) {
	  Subclass.prototype = Object.create(Error.prototype);
	  Subclass.prototype.constructor = Subclass;
	  return Subclass;
	}
	return error_classes;
}

var fastJsonStableStringify;
var hasRequiredFastJsonStableStringify;

function requireFastJsonStableStringify () {
	if (hasRequiredFastJsonStableStringify) return fastJsonStableStringify;
	hasRequiredFastJsonStableStringify = 1;

	fastJsonStableStringify = function (data, opts) {
	    if (!opts) opts = {};
	    if (typeof opts === 'function') opts = { cmp: opts };
	    var cycles = (typeof opts.cycles === 'boolean') ? opts.cycles : false;

	    var cmp = opts.cmp && (function (f) {
	        return function (node) {
	            return function (a, b) {
	                var aobj = { key: a, value: node[a] };
	                var bobj = { key: b, value: node[b] };
	                return f(aobj, bobj);
	            };
	        };
	    })(opts.cmp);

	    var seen = [];
	    return (function stringify (node) {
	        if (node && node.toJSON && typeof node.toJSON === 'function') {
	            node = node.toJSON();
	        }

	        if (node === undefined) return;
	        if (typeof node == 'number') return isFinite(node) ? '' + node : 'null';
	        if (typeof node !== 'object') return JSON.stringify(node);

	        var i, out;
	        if (Array.isArray(node)) {
	            out = '[';
	            for (i = 0; i < node.length; i++) {
	                if (i) out += ',';
	                out += stringify(node[i]) || 'null';
	            }
	            return out + ']';
	        }

	        if (node === null) return 'null';

	        if (seen.indexOf(node) !== -1) {
	            if (cycles) return JSON.stringify('__cycle__');
	            throw new TypeError('Converting circular structure to JSON');
	        }

	        var seenIndex = seen.push(node) - 1;
	        var keys = Object.keys(node).sort(cmp && cmp(node));
	        out = '';
	        for (i = 0; i < keys.length; i++) {
	            var key = keys[i];
	            var value = stringify(node[key]);

	            if (!value) continue;
	            if (out) out += ',';
	            out += JSON.stringify(key) + ':' + value;
	        }
	        seen.splice(seenIndex, 1);
	        return '{' + out + '}';
	    })(data);
	};
	return fastJsonStableStringify;
}

var validate;
var hasRequiredValidate;

function requireValidate () {
	if (hasRequiredValidate) return validate;
	hasRequiredValidate = 1;
	validate = function generate_validate(it, $keyword, $ruleType) {
	  var out = '';
	  var $async = it.schema.$async === true,
	    $refKeywords = it.util.schemaHasRulesExcept(it.schema, it.RULES.all, '$ref'),
	    $id = it.self._getId(it.schema);
	  if (it.opts.strictKeywords) {
	    var $unknownKwd = it.util.schemaUnknownRules(it.schema, it.RULES.keywords);
	    if ($unknownKwd) {
	      var $keywordsMsg = 'unknown keyword: ' + $unknownKwd;
	      if (it.opts.strictKeywords === 'log') it.logger.warn($keywordsMsg);
	      else throw new Error($keywordsMsg);
	    }
	  }
	  if (it.isTop) {
	    out += ' var validate = ';
	    if ($async) {
	      it.async = true;
	      out += 'async ';
	    }
	    out += 'function(data, dataPath, parentData, parentDataProperty, rootData) { \'use strict\'; ';
	    if ($id && (it.opts.sourceCode || it.opts.processCode)) {
	      out += ' ' + ('/\*# sourceURL=' + $id + ' */') + ' ';
	    }
	  }
	  if (typeof it.schema == 'boolean' || !($refKeywords || it.schema.$ref)) {
	    var $keyword = 'false schema';
	    var $lvl = it.level;
	    var $dataLvl = it.dataLevel;
	    var $schema = it.schema[$keyword];
	    var $schemaPath = it.schemaPath + it.util.getProperty($keyword);
	    var $errSchemaPath = it.errSchemaPath + '/' + $keyword;
	    var $breakOnError = !it.opts.allErrors;
	    var $errorKeyword;
	    var $data = 'data' + ($dataLvl || '');
	    var $valid = 'valid' + $lvl;
	    if (it.schema === false) {
	      if (it.isTop) {
	        $breakOnError = true;
	      } else {
	        out += ' var ' + ($valid) + ' = false; ';
	      }
	      var $$outStack = $$outStack || [];
	      $$outStack.push(out);
	      out = ''; /* istanbul ignore else */
	      if (it.createErrors !== false) {
	        out += ' { keyword: \'' + ($errorKeyword || 'false schema') + '\' , dataPath: (dataPath || \'\') + ' + (it.errorPath) + ' , schemaPath: ' + (it.util.toQuotedString($errSchemaPath)) + ' , params: {} ';
	        if (it.opts.messages !== false) {
	          out += ' , message: \'boolean schema is false\' ';
	        }
	        if (it.opts.verbose) {
	          out += ' , schema: false , parentSchema: validate.schema' + (it.schemaPath) + ' , data: ' + ($data) + ' ';
	        }
	        out += ' } ';
	      } else {
	        out += ' {} ';
	      }
	      var __err = out;
	      out = $$outStack.pop();
	      if (!it.compositeRule && $breakOnError) {
	        /* istanbul ignore if */
	        if (it.async) {
	          out += ' throw new ValidationError([' + (__err) + ']); ';
	        } else {
	          out += ' validate.errors = [' + (__err) + ']; return false; ';
	        }
	      } else {
	        out += ' var err = ' + (__err) + ';  if (vErrors === null) vErrors = [err]; else vErrors.push(err); errors++; ';
	      }
	    } else {
	      if (it.isTop) {
	        if ($async) {
	          out += ' return data; ';
	        } else {
	          out += ' validate.errors = null; return true; ';
	        }
	      } else {
	        out += ' var ' + ($valid) + ' = true; ';
	      }
	    }
	    if (it.isTop) {
	      out += ' }; return validate; ';
	    }
	    return out;
	  }
	  if (it.isTop) {
	    var $top = it.isTop,
	      $lvl = it.level = 0,
	      $dataLvl = it.dataLevel = 0,
	      $data = 'data';
	    it.rootId = it.resolve.fullPath(it.self._getId(it.root.schema));
	    it.baseId = it.baseId || it.rootId;
	    delete it.isTop;
	    it.dataPathArr = [""];
	    if (it.schema.default !== undefined && it.opts.useDefaults && it.opts.strictDefaults) {
	      var $defaultMsg = 'default is ignored in the schema root';
	      if (it.opts.strictDefaults === 'log') it.logger.warn($defaultMsg);
	      else throw new Error($defaultMsg);
	    }
	    out += ' var vErrors = null; ';
	    out += ' var errors = 0;     ';
	    out += ' if (rootData === undefined) rootData = data; ';
	  } else {
	    var $lvl = it.level,
	      $dataLvl = it.dataLevel,
	      $data = 'data' + ($dataLvl || '');
	    if ($id) it.baseId = it.resolve.url(it.baseId, $id);
	    if ($async && !it.async) throw new Error('async schema in sync schema');
	    out += ' var errs_' + ($lvl) + ' = errors;';
	  }
	  var $valid = 'valid' + $lvl,
	    $breakOnError = !it.opts.allErrors,
	    $closingBraces1 = '',
	    $closingBraces2 = '';
	  var $errorKeyword;
	  var $typeSchema = it.schema.type,
	    $typeIsArray = Array.isArray($typeSchema);
	  if ($typeSchema && it.opts.nullable && it.schema.nullable === true) {
	    if ($typeIsArray) {
	      if ($typeSchema.indexOf('null') == -1) $typeSchema = $typeSchema.concat('null');
	    } else if ($typeSchema != 'null') {
	      $typeSchema = [$typeSchema, 'null'];
	      $typeIsArray = true;
	    }
	  }
	  if ($typeIsArray && $typeSchema.length == 1) {
	    $typeSchema = $typeSchema[0];
	    $typeIsArray = false;
	  }
	  if (it.schema.$ref && $refKeywords) {
	    if (it.opts.extendRefs == 'fail') {
	      throw new Error('$ref: validation keywords used in schema at path "' + it.errSchemaPath + '" (see option extendRefs)');
	    } else if (it.opts.extendRefs !== true) {
	      $refKeywords = false;
	      it.logger.warn('$ref: keywords ignored in schema at path "' + it.errSchemaPath + '"');
	    }
	  }
	  if (it.schema.$comment && it.opts.$comment) {
	    out += ' ' + (it.RULES.all.$comment.code(it, '$comment'));
	  }
	  if ($typeSchema) {
	    if (it.opts.coerceTypes) {
	      var $coerceToTypes = it.util.coerceToTypes(it.opts.coerceTypes, $typeSchema);
	    }
	    var $rulesGroup = it.RULES.types[$typeSchema];
	    if ($coerceToTypes || $typeIsArray || $rulesGroup === true || ($rulesGroup && !$shouldUseGroup($rulesGroup))) {
	      var $schemaPath = it.schemaPath + '.type',
	        $errSchemaPath = it.errSchemaPath + '/type';
	      var $schemaPath = it.schemaPath + '.type',
	        $errSchemaPath = it.errSchemaPath + '/type',
	        $method = $typeIsArray ? 'checkDataTypes' : 'checkDataType';
	      out += ' if (' + (it.util[$method]($typeSchema, $data, it.opts.strictNumbers, true)) + ') { ';
	      if ($coerceToTypes) {
	        var $dataType = 'dataType' + $lvl,
	          $coerced = 'coerced' + $lvl;
	        out += ' var ' + ($dataType) + ' = typeof ' + ($data) + '; var ' + ($coerced) + ' = undefined; ';
	        if (it.opts.coerceTypes == 'array') {
	          out += ' if (' + ($dataType) + ' == \'object\' && Array.isArray(' + ($data) + ') && ' + ($data) + '.length == 1) { ' + ($data) + ' = ' + ($data) + '[0]; ' + ($dataType) + ' = typeof ' + ($data) + '; if (' + (it.util.checkDataType(it.schema.type, $data, it.opts.strictNumbers)) + ') ' + ($coerced) + ' = ' + ($data) + '; } ';
	        }
	        out += ' if (' + ($coerced) + ' !== undefined) ; ';
	        var arr1 = $coerceToTypes;
	        if (arr1) {
	          var $type, $i = -1,
	            l1 = arr1.length - 1;
	          while ($i < l1) {
	            $type = arr1[$i += 1];
	            if ($type == 'string') {
	              out += ' else if (' + ($dataType) + ' == \'number\' || ' + ($dataType) + ' == \'boolean\') ' + ($coerced) + ' = \'\' + ' + ($data) + '; else if (' + ($data) + ' === null) ' + ($coerced) + ' = \'\'; ';
	            } else if ($type == 'number' || $type == 'integer') {
	              out += ' else if (' + ($dataType) + ' == \'boolean\' || ' + ($data) + ' === null || (' + ($dataType) + ' == \'string\' && ' + ($data) + ' && ' + ($data) + ' == +' + ($data) + ' ';
	              if ($type == 'integer') {
	                out += ' && !(' + ($data) + ' % 1)';
	              }
	              out += ')) ' + ($coerced) + ' = +' + ($data) + '; ';
	            } else if ($type == 'boolean') {
	              out += ' else if (' + ($data) + ' === \'false\' || ' + ($data) + ' === 0 || ' + ($data) + ' === null) ' + ($coerced) + ' = false; else if (' + ($data) + ' === \'true\' || ' + ($data) + ' === 1) ' + ($coerced) + ' = true; ';
	            } else if ($type == 'null') {
	              out += ' else if (' + ($data) + ' === \'\' || ' + ($data) + ' === 0 || ' + ($data) + ' === false) ' + ($coerced) + ' = null; ';
	            } else if (it.opts.coerceTypes == 'array' && $type == 'array') {
	              out += ' else if (' + ($dataType) + ' == \'string\' || ' + ($dataType) + ' == \'number\' || ' + ($dataType) + ' == \'boolean\' || ' + ($data) + ' == null) ' + ($coerced) + ' = [' + ($data) + ']; ';
	            }
	          }
	        }
	        out += ' else {   ';
	        var $$outStack = $$outStack || [];
	        $$outStack.push(out);
	        out = ''; /* istanbul ignore else */
	        if (it.createErrors !== false) {
	          out += ' { keyword: \'' + ($errorKeyword || 'type') + '\' , dataPath: (dataPath || \'\') + ' + (it.errorPath) + ' , schemaPath: ' + (it.util.toQuotedString($errSchemaPath)) + ' , params: { type: \'';
	          if ($typeIsArray) {
	            out += '' + ($typeSchema.join(","));
	          } else {
	            out += '' + ($typeSchema);
	          }
	          out += '\' } ';
	          if (it.opts.messages !== false) {
	            out += ' , message: \'should be ';
	            if ($typeIsArray) {
	              out += '' + ($typeSchema.join(","));
	            } else {
	              out += '' + ($typeSchema);
	            }
	            out += '\' ';
	          }
	          if (it.opts.verbose) {
	            out += ' , schema: validate.schema' + ($schemaPath) + ' , parentSchema: validate.schema' + (it.schemaPath) + ' , data: ' + ($data) + ' ';
	          }
	          out += ' } ';
	        } else {
	          out += ' {} ';
	        }
	        var __err = out;
	        out = $$outStack.pop();
	        if (!it.compositeRule && $breakOnError) {
	          /* istanbul ignore if */
	          if (it.async) {
	            out += ' throw new ValidationError([' + (__err) + ']); ';
	          } else {
	            out += ' validate.errors = [' + (__err) + ']; return false; ';
	          }
	        } else {
	          out += ' var err = ' + (__err) + ';  if (vErrors === null) vErrors = [err]; else vErrors.push(err); errors++; ';
	        }
	        out += ' } if (' + ($coerced) + ' !== undefined) {  ';
	        var $parentData = $dataLvl ? 'data' + (($dataLvl - 1) || '') : 'parentData',
	          $parentDataProperty = $dataLvl ? it.dataPathArr[$dataLvl] : 'parentDataProperty';
	        out += ' ' + ($data) + ' = ' + ($coerced) + '; ';
	        if (!$dataLvl) {
	          out += 'if (' + ($parentData) + ' !== undefined)';
	        }
	        out += ' ' + ($parentData) + '[' + ($parentDataProperty) + '] = ' + ($coerced) + '; } ';
	      } else {
	        var $$outStack = $$outStack || [];
	        $$outStack.push(out);
	        out = ''; /* istanbul ignore else */
	        if (it.createErrors !== false) {
	          out += ' { keyword: \'' + ($errorKeyword || 'type') + '\' , dataPath: (dataPath || \'\') + ' + (it.errorPath) + ' , schemaPath: ' + (it.util.toQuotedString($errSchemaPath)) + ' , params: { type: \'';
	          if ($typeIsArray) {
	            out += '' + ($typeSchema.join(","));
	          } else {
	            out += '' + ($typeSchema);
	          }
	          out += '\' } ';
	          if (it.opts.messages !== false) {
	            out += ' , message: \'should be ';
	            if ($typeIsArray) {
	              out += '' + ($typeSchema.join(","));
	            } else {
	              out += '' + ($typeSchema);
	            }
	            out += '\' ';
	          }
	          if (it.opts.verbose) {
	            out += ' , schema: validate.schema' + ($schemaPath) + ' , parentSchema: validate.schema' + (it.schemaPath) + ' , data: ' + ($data) + ' ';
	          }
	          out += ' } ';
	        } else {
	          out += ' {} ';
	        }
	        var __err = out;
	        out = $$outStack.pop();
	        if (!it.compositeRule && $breakOnError) {
	          /* istanbul ignore if */
	          if (it.async) {
	            out += ' throw new ValidationError([' + (__err) + ']); ';
	          } else {
	            out += ' validate.errors = [' + (__err) + ']; return false; ';
	          }
	        } else {
	          out += ' var err = ' + (__err) + ';  if (vErrors === null) vErrors = [err]; else vErrors.push(err); errors++; ';
	        }
	      }
	      out += ' } ';
	    }
	  }
	  if (it.schema.$ref && !$refKeywords) {
	    out += ' ' + (it.RULES.all.$ref.code(it, '$ref')) + ' ';
	    if ($breakOnError) {
	      out += ' } if (errors === ';
	      if ($top) {
	        out += '0';
	      } else {
	        out += 'errs_' + ($lvl);
	      }
	      out += ') { ';
	      $closingBraces2 += '}';
	    }
	  } else {
	    var arr2 = it.RULES;
	    if (arr2) {
	      var $rulesGroup, i2 = -1,
	        l2 = arr2.length - 1;
	      while (i2 < l2) {
	        $rulesGroup = arr2[i2 += 1];
	        if ($shouldUseGroup($rulesGroup)) {
	          if ($rulesGroup.type) {
	            out += ' if (' + (it.util.checkDataType($rulesGroup.type, $data, it.opts.strictNumbers)) + ') { ';
	          }
	          if (it.opts.useDefaults) {
	            if ($rulesGroup.type == 'object' && it.schema.properties) {
	              var $schema = it.schema.properties,
	                $schemaKeys = Object.keys($schema);
	              var arr3 = $schemaKeys;
	              if (arr3) {
	                var $propertyKey, i3 = -1,
	                  l3 = arr3.length - 1;
	                while (i3 < l3) {
	                  $propertyKey = arr3[i3 += 1];
	                  var $sch = $schema[$propertyKey];
	                  if ($sch.default !== undefined) {
	                    var $passData = $data + it.util.getProperty($propertyKey);
	                    if (it.compositeRule) {
	                      if (it.opts.strictDefaults) {
	                        var $defaultMsg = 'default is ignored for: ' + $passData;
	                        if (it.opts.strictDefaults === 'log') it.logger.warn($defaultMsg);
	                        else throw new Error($defaultMsg);
	                      }
	                    } else {
	                      out += ' if (' + ($passData) + ' === undefined ';
	                      if (it.opts.useDefaults == 'empty') {
	                        out += ' || ' + ($passData) + ' === null || ' + ($passData) + ' === \'\' ';
	                      }
	                      out += ' ) ' + ($passData) + ' = ';
	                      if (it.opts.useDefaults == 'shared') {
	                        out += ' ' + (it.useDefault($sch.default)) + ' ';
	                      } else {
	                        out += ' ' + (JSON.stringify($sch.default)) + ' ';
	                      }
	                      out += '; ';
	                    }
	                  }
	                }
	              }
	            } else if ($rulesGroup.type == 'array' && Array.isArray(it.schema.items)) {
	              var arr4 = it.schema.items;
	              if (arr4) {
	                var $sch, $i = -1,
	                  l4 = arr4.length - 1;
	                while ($i < l4) {
	                  $sch = arr4[$i += 1];
	                  if ($sch.default !== undefined) {
	                    var $passData = $data + '[' + $i + ']';
	                    if (it.compositeRule) {
	                      if (it.opts.strictDefaults) {
	                        var $defaultMsg = 'default is ignored for: ' + $passData;
	                        if (it.opts.strictDefaults === 'log') it.logger.warn($defaultMsg);
	                        else throw new Error($defaultMsg);
	                      }
	                    } else {
	                      out += ' if (' + ($passData) + ' === undefined ';
	                      if (it.opts.useDefaults == 'empty') {
	                        out += ' || ' + ($passData) + ' === null || ' + ($passData) + ' === \'\' ';
	                      }
	                      out += ' ) ' + ($passData) + ' = ';
	                      if (it.opts.useDefaults == 'shared') {
	                        out += ' ' + (it.useDefault($sch.default)) + ' ';
	                      } else {
	                        out += ' ' + (JSON.stringify($sch.default)) + ' ';
	                      }
	                      out += '; ';
	                    }
	                  }
	                }
	              }
	            }
	          }
	          var arr5 = $rulesGroup.rules;
	          if (arr5) {
	            var $rule, i5 = -1,
	              l5 = arr5.length - 1;
	            while (i5 < l5) {
	              $rule = arr5[i5 += 1];
	              if ($shouldUseRule($rule)) {
	                var $code = $rule.code(it, $rule.keyword, $rulesGroup.type);
	                if ($code) {
	                  out += ' ' + ($code) + ' ';
	                  if ($breakOnError) {
	                    $closingBraces1 += '}';
	                  }
	                }
	              }
	            }
	          }
	          if ($breakOnError) {
	            out += ' ' + ($closingBraces1) + ' ';
	            $closingBraces1 = '';
	          }
	          if ($rulesGroup.type) {
	            out += ' } ';
	            if ($typeSchema && $typeSchema === $rulesGroup.type && !$coerceToTypes) {
	              out += ' else { ';
	              var $schemaPath = it.schemaPath + '.type',
	                $errSchemaPath = it.errSchemaPath + '/type';
	              var $$outStack = $$outStack || [];
	              $$outStack.push(out);
	              out = ''; /* istanbul ignore else */
	              if (it.createErrors !== false) {
	                out += ' { keyword: \'' + ($errorKeyword || 'type') + '\' , dataPath: (dataPath || \'\') + ' + (it.errorPath) + ' , schemaPath: ' + (it.util.toQuotedString($errSchemaPath)) + ' , params: { type: \'';
	                if ($typeIsArray) {
	                  out += '' + ($typeSchema.join(","));
	                } else {
	                  out += '' + ($typeSchema);
	                }
	                out += '\' } ';
	                if (it.opts.messages !== false) {
	                  out += ' , message: \'should be ';
	                  if ($typeIsArray) {
	                    out += '' + ($typeSchema.join(","));
	                  } else {
	                    out += '' + ($typeSchema);
	                  }
	                  out += '\' ';
	                }
	                if (it.opts.verbose) {
	                  out += ' , schema: validate.schema' + ($schemaPath) + ' , parentSchema: validate.schema' + (it.schemaPath) + ' , data: ' + ($data) + ' ';
	                }
	                out += ' } ';
	              } else {
	                out += ' {} ';
	              }
	              var __err = out;
	              out = $$outStack.pop();
	              if (!it.compositeRule && $breakOnError) {
	                /* istanbul ignore if */
	                if (it.async) {
	                  out += ' throw new ValidationError([' + (__err) + ']); ';
	                } else {
	                  out += ' validate.errors = [' + (__err) + ']; return false; ';
	                }
	              } else {
	                out += ' var err = ' + (__err) + ';  if (vErrors === null) vErrors = [err]; else vErrors.push(err); errors++; ';
	              }
	              out += ' } ';
	            }
	          }
	          if ($breakOnError) {
	            out += ' if (errors === ';
	            if ($top) {
	              out += '0';
	            } else {
	              out += 'errs_' + ($lvl);
	            }
	            out += ') { ';
	            $closingBraces2 += '}';
	          }
	        }
	      }
	    }
	  }
	  if ($breakOnError) {
	    out += ' ' + ($closingBraces2) + ' ';
	  }
	  if ($top) {
	    if ($async) {
	      out += ' if (errors === 0) return data;           ';
	      out += ' else throw new ValidationError(vErrors); ';
	    } else {
	      out += ' validate.errors = vErrors; ';
	      out += ' return errors === 0;       ';
	    }
	    out += ' }; return validate;';
	  } else {
	    out += ' var ' + ($valid) + ' = errors === errs_' + ($lvl) + ';';
	  }

	  function $shouldUseGroup($rulesGroup) {
	    var rules = $rulesGroup.rules;
	    for (var i = 0; i < rules.length; i++)
	      if ($shouldUseRule(rules[i])) return true;
	  }

	  function $shouldUseRule($rule) {
	    return it.schema[$rule.keyword] !== undefined || ($rule.implements && $ruleImplementsSomeKeyword($rule));
	  }

	  function $ruleImplementsSomeKeyword($rule) {
	    var impl = $rule.implements;
	    for (var i = 0; i < impl.length; i++)
	      if (it.schema[impl[i]] !== undefined) return true;
	  }
	  return out;
	};
	return validate;
}

var compile_1;
var hasRequiredCompile;

function requireCompile () {
	if (hasRequiredCompile) return compile_1;
	hasRequiredCompile = 1;

	var resolve = requireResolve()
	  , util = requireUtil()
	  , errorClasses = requireError_classes()
	  , stableStringify = requireFastJsonStableStringify();

	var validateGenerator = requireValidate();

	/**
	 * Functions below are used inside compiled validations function
	 */

	var ucs2length = util.ucs2length;
	var equal = requireFastDeepEqual();

	// this error is thrown by async schemas to return validation errors via exception
	var ValidationError = errorClasses.Validation;

	compile_1 = compile;


	/**
	 * Compiles schema to validation function
	 * @this   Ajv
	 * @param  {Object} schema schema object
	 * @param  {Object} root object with information about the root schema for this schema
	 * @param  {Object} localRefs the hash of local references inside the schema (created by resolve.id), used for inline resolution
	 * @param  {String} baseId base ID for IDs in the schema
	 * @return {Function} validation function
	 */
	function compile(schema, root, localRefs, baseId) {
	  /* jshint validthis: true, evil: true */
	  /* eslint no-shadow: 0 */
	  var self = this
	    , opts = this._opts
	    , refVal = [ undefined ]
	    , refs = {}
	    , patterns = []
	    , patternsHash = {}
	    , defaults = []
	    , defaultsHash = {}
	    , customRules = [];

	  root = root || { schema: schema, refVal: refVal, refs: refs };

	  var c = checkCompiling.call(this, schema, root, baseId);
	  var compilation = this._compilations[c.index];
	  if (c.compiling) return (compilation.callValidate = callValidate);

	  var formats = this._formats;
	  var RULES = this.RULES;

	  try {
	    var v = localCompile(schema, root, localRefs, baseId);
	    compilation.validate = v;
	    var cv = compilation.callValidate;
	    if (cv) {
	      cv.schema = v.schema;
	      cv.errors = null;
	      cv.refs = v.refs;
	      cv.refVal = v.refVal;
	      cv.root = v.root;
	      cv.$async = v.$async;
	      if (opts.sourceCode) cv.source = v.source;
	    }
	    return v;
	  } finally {
	    endCompiling.call(this, schema, root, baseId);
	  }

	  /* @this   {*} - custom context, see passContext option */
	  function callValidate() {
	    /* jshint validthis: true */
	    var validate = compilation.validate;
	    var result = validate.apply(this, arguments);
	    callValidate.errors = validate.errors;
	    return result;
	  }

	  function localCompile(_schema, _root, localRefs, baseId) {
	    var isRoot = !_root || (_root && _root.schema == _schema);
	    if (_root.schema != root.schema)
	      return compile.call(self, _schema, _root, localRefs, baseId);

	    var $async = _schema.$async === true;

	    var sourceCode = validateGenerator({
	      isTop: true,
	      schema: _schema,
	      isRoot: isRoot,
	      baseId: baseId,
	      root: _root,
	      schemaPath: '',
	      errSchemaPath: '#',
	      errorPath: '""',
	      MissingRefError: errorClasses.MissingRef,
	      RULES: RULES,
	      validate: validateGenerator,
	      util: util,
	      resolve: resolve,
	      resolveRef: resolveRef,
	      usePattern: usePattern,
	      useDefault: useDefault,
	      useCustomRule: useCustomRule,
	      opts: opts,
	      formats: formats,
	      logger: self.logger,
	      self: self
	    });

	    sourceCode = vars(refVal, refValCode) + vars(patterns, patternCode)
	                   + vars(defaults, defaultCode) + vars(customRules, customRuleCode)
	                   + sourceCode;

	    if (opts.processCode) sourceCode = opts.processCode(sourceCode, _schema);
	    // console.log('\n\n\n *** \n', JSON.stringify(sourceCode));
	    var validate;
	    try {
	      var makeValidate = new Function(
	        'self',
	        'RULES',
	        'formats',
	        'root',
	        'refVal',
	        'defaults',
	        'customRules',
	        'equal',
	        'ucs2length',
	        'ValidationError',
	        sourceCode
	      );

	      validate = makeValidate(
	        self,
	        RULES,
	        formats,
	        root,
	        refVal,
	        defaults,
	        customRules,
	        equal,
	        ucs2length,
	        ValidationError
	      );

	      refVal[0] = validate;
	    } catch(e) {
	      self.logger.error('Error compiling schema, function code:', sourceCode);
	      throw e;
	    }

	    validate.schema = _schema;
	    validate.errors = null;
	    validate.refs = refs;
	    validate.refVal = refVal;
	    validate.root = isRoot ? validate : _root;
	    if ($async) validate.$async = true;
	    if (opts.sourceCode === true) {
	      validate.source = {
	        code: sourceCode,
	        patterns: patterns,
	        defaults: defaults
	      };
	    }

	    return validate;
	  }

	  function resolveRef(baseId, ref, isRoot) {
	    ref = resolve.url(baseId, ref);
	    var refIndex = refs[ref];
	    var _refVal, refCode;
	    if (refIndex !== undefined) {
	      _refVal = refVal[refIndex];
	      refCode = 'refVal[' + refIndex + ']';
	      return resolvedRef(_refVal, refCode);
	    }
	    if (!isRoot && root.refs) {
	      var rootRefId = root.refs[ref];
	      if (rootRefId !== undefined) {
	        _refVal = root.refVal[rootRefId];
	        refCode = addLocalRef(ref, _refVal);
	        return resolvedRef(_refVal, refCode);
	      }
	    }

	    refCode = addLocalRef(ref);
	    var v = resolve.call(self, localCompile, root, ref);
	    if (v === undefined) {
	      var localSchema = localRefs && localRefs[ref];
	      if (localSchema) {
	        v = resolve.inlineRef(localSchema, opts.inlineRefs)
	            ? localSchema
	            : compile.call(self, localSchema, root, localRefs, baseId);
	      }
	    }

	    if (v === undefined) {
	      removeLocalRef(ref);
	    } else {
	      replaceLocalRef(ref, v);
	      return resolvedRef(v, refCode);
	    }
	  }

	  function addLocalRef(ref, v) {
	    var refId = refVal.length;
	    refVal[refId] = v;
	    refs[ref] = refId;
	    return 'refVal' + refId;
	  }

	  function removeLocalRef(ref) {
	    delete refs[ref];
	  }

	  function replaceLocalRef(ref, v) {
	    var refId = refs[ref];
	    refVal[refId] = v;
	  }

	  function resolvedRef(refVal, code) {
	    return typeof refVal == 'object' || typeof refVal == 'boolean'
	            ? { code: code, schema: refVal, inline: true }
	            : { code: code, $async: refVal && !!refVal.$async };
	  }

	  function usePattern(regexStr) {
	    var index = patternsHash[regexStr];
	    if (index === undefined) {
	      index = patternsHash[regexStr] = patterns.length;
	      patterns[index] = regexStr;
	    }
	    return 'pattern' + index;
	  }

	  function useDefault(value) {
	    switch (typeof value) {
	      case 'boolean':
	      case 'number':
	        return '' + value;
	      case 'string':
	        return util.toQuotedString(value);
	      case 'object':
	        if (value === null) return 'null';
	        var valueStr = stableStringify(value);
	        var index = defaultsHash[valueStr];
	        if (index === undefined) {
	          index = defaultsHash[valueStr] = defaults.length;
	          defaults[index] = value;
	        }
	        return 'default' + index;
	    }
	  }

	  function useCustomRule(rule, schema, parentSchema, it) {
	    if (self._opts.validateSchema !== false) {
	      var deps = rule.definition.dependencies;
	      if (deps && !deps.every(function(keyword) {
	        return Object.prototype.hasOwnProperty.call(parentSchema, keyword);
	      }))
	        throw new Error('parent schema must have all required keywords: ' + deps.join(','));

	      var validateSchema = rule.definition.validateSchema;
	      if (validateSchema) {
	        var valid = validateSchema(schema);
	        if (!valid) {
	          var message = 'keyword schema is invalid: ' + self.errorsText(validateSchema.errors);
	          if (self._opts.validateSchema == 'log') self.logger.error(message);
	          else throw new Error(message);
	        }
	      }
	    }

	    var compile = rule.definition.compile
	      , inline = rule.definition.inline
	      , macro = rule.definition.macro;

	    var validate;
	    if (compile) {
	      validate = compile.call(self, schema, parentSchema, it);
	    } else if (macro) {
	      validate = macro.call(self, schema, parentSchema, it);
	      if (opts.validateSchema !== false) self.validateSchema(validate, true);
	    } else if (inline) {
	      validate = inline.call(self, it, rule.keyword, schema, parentSchema);
	    } else {
	      validate = rule.definition.validate;
	      if (!validate) return;
	    }

	    if (validate === undefined)
	      throw new Error('custom keyword "' + rule.keyword + '"failed to compile');

	    var index = customRules.length;
	    customRules[index] = validate;

	    return {
	      code: 'customRule' + index,
	      validate: validate
	    };
	  }
	}


	/**
	 * Checks if the schema is currently compiled
	 * @this   Ajv
	 * @param  {Object} schema schema to compile
	 * @param  {Object} root root object
	 * @param  {String} baseId base schema ID
	 * @return {Object} object with properties "index" (compilation index) and "compiling" (boolean)
	 */
	function checkCompiling(schema, root, baseId) {
	  /* jshint validthis: true */
	  var index = compIndex.call(this, schema, root, baseId);
	  if (index >= 0) return { index: index, compiling: true };
	  index = this._compilations.length;
	  this._compilations[index] = {
	    schema: schema,
	    root: root,
	    baseId: baseId
	  };
	  return { index: index, compiling: false };
	}


	/**
	 * Removes the schema from the currently compiled list
	 * @this   Ajv
	 * @param  {Object} schema schema to compile
	 * @param  {Object} root root object
	 * @param  {String} baseId base schema ID
	 */
	function endCompiling(schema, root, baseId) {
	  /* jshint validthis: true */
	  var i = compIndex.call(this, schema, root, baseId);
	  if (i >= 0) this._compilations.splice(i, 1);
	}


	/**
	 * Index of schema compilation in the currently compiled list
	 * @this   Ajv
	 * @param  {Object} schema schema to compile
	 * @param  {Object} root root object
	 * @param  {String} baseId base schema ID
	 * @return {Integer} compilation index
	 */
	function compIndex(schema, root, baseId) {
	  /* jshint validthis: true */
	  for (var i=0; i<this._compilations.length; i++) {
	    var c = this._compilations[i];
	    if (c.schema == schema && c.root == root && c.baseId == baseId) return i;
	  }
	  return -1;
	}


	function patternCode(i, patterns) {
	  return 'var pattern' + i + ' = new RegExp(' + util.toQuotedString(patterns[i]) + ');';
	}


	function defaultCode(i) {
	  return 'var default' + i + ' = defaults[' + i + '];';
	}


	function refValCode(i, refVal) {
	  return refVal[i] === undefined ? '' : 'var refVal' + i + ' = refVal[' + i + '];';
	}


	function customRuleCode(i) {
	  return 'var customRule' + i + ' = customRules[' + i + '];';
	}


	function vars(arr, statement) {
	  if (!arr.length) return '';
	  var code = '';
	  for (var i=0; i<arr.length; i++)
	    code += statement(i, arr);
	  return code;
	}
	return compile_1;
}

var cache = {exports: {}};

var hasRequiredCache;

function requireCache () {
	if (hasRequiredCache) return cache.exports;
	hasRequiredCache = 1;


	var Cache = cache.exports = function Cache() {
	  this._cache = {};
	};


	Cache.prototype.put = function Cache_put(key, value) {
	  this._cache[key] = value;
	};


	Cache.prototype.get = function Cache_get(key) {
	  return this._cache[key];
	};


	Cache.prototype.del = function Cache_del(key) {
	  delete this._cache[key];
	};


	Cache.prototype.clear = function Cache_clear() {
	  this._cache = {};
	};
	return cache.exports;
}

var formats_1;
var hasRequiredFormats;

function requireFormats () {
	if (hasRequiredFormats) return formats_1;
	hasRequiredFormats = 1;

	var util = requireUtil();

	var DATE = /^(\d\d\d\d)-(\d\d)-(\d\d)$/;
	var DAYS = [0,31,28,31,30,31,30,31,31,30,31,30,31];
	var TIME = /^(\d\d):(\d\d):(\d\d)(\.\d+)?(z|[+-]\d\d(?::?\d\d)?)?$/i;
	var HOSTNAME = /^(?=.{1,253}\.?$)[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?(?:\.[a-z0-9](?:[-0-9a-z]{0,61}[0-9a-z])?)*\.?$/i;
	var URI = /^(?:[a-z][a-z0-9+\-.]*:)(?:\/?\/(?:(?:[a-z0-9\-._~!$&'()*+,;=:]|%[0-9a-f]{2})*@)?(?:\[(?:(?:(?:(?:[0-9a-f]{1,4}:){6}|::(?:[0-9a-f]{1,4}:){5}|(?:[0-9a-f]{1,4})?::(?:[0-9a-f]{1,4}:){4}|(?:(?:[0-9a-f]{1,4}:){0,1}[0-9a-f]{1,4})?::(?:[0-9a-f]{1,4}:){3}|(?:(?:[0-9a-f]{1,4}:){0,2}[0-9a-f]{1,4})?::(?:[0-9a-f]{1,4}:){2}|(?:(?:[0-9a-f]{1,4}:){0,3}[0-9a-f]{1,4})?::[0-9a-f]{1,4}:|(?:(?:[0-9a-f]{1,4}:){0,4}[0-9a-f]{1,4})?::)(?:[0-9a-f]{1,4}:[0-9a-f]{1,4}|(?:(?:25[0-5]|2[0-4]\d|[01]?\d\d?)\.){3}(?:25[0-5]|2[0-4]\d|[01]?\d\d?))|(?:(?:[0-9a-f]{1,4}:){0,5}[0-9a-f]{1,4})?::[0-9a-f]{1,4}|(?:(?:[0-9a-f]{1,4}:){0,6}[0-9a-f]{1,4})?::)|[Vv][0-9a-f]+\.[a-z0-9\-._~!$&'()*+,;=:]+)\]|(?:(?:25[0-5]|2[0-4]\d|[01]?\d\d?)\.){3}(?:25[0-5]|2[0-4]\d|[01]?\d\d?)|(?:[a-z0-9\-._~!$&'()*+,;=]|%[0-9a-f]{2})*)(?::\d*)?(?:\/(?:[a-z0-9\-._~!$&'()*+,;=:@]|%[0-9a-f]{2})*)*|\/(?:(?:[a-z0-9\-._~!$&'()*+,;=:@]|%[0-9a-f]{2})+(?:\/(?:[a-z0-9\-._~!$&'()*+,;=:@]|%[0-9a-f]{2})*)*)?|(?:[a-z0-9\-._~!$&'()*+,;=:@]|%[0-9a-f]{2})+(?:\/(?:[a-z0-9\-._~!$&'()*+,;=:@]|%[0-9a-f]{2})*)*)(?:\?(?:[a-z0-9\-._~!$&'()*+,;=:@/?]|%[0-9a-f]{2})*)?(?:#(?:[a-z0-9\-._~!$&'()*+,;=:@/?]|%[0-9a-f]{2})*)?$/i;
	var URIREF = /^(?:[a-z][a-z0-9+\-.]*:)?(?:\/?\/(?:(?:[a-z0-9\-._~!$&'()*+,;=:]|%[0-9a-f]{2})*@)?(?:\[(?:(?:(?:(?:[0-9a-f]{1,4}:){6}|::(?:[0-9a-f]{1,4}:){5}|(?:[0-9a-f]{1,4})?::(?:[0-9a-f]{1,4}:){4}|(?:(?:[0-9a-f]{1,4}:){0,1}[0-9a-f]{1,4})?::(?:[0-9a-f]{1,4}:){3}|(?:(?:[0-9a-f]{1,4}:){0,2}[0-9a-f]{1,4})?::(?:[0-9a-f]{1,4}:){2}|(?:(?:[0-9a-f]{1,4}:){0,3}[0-9a-f]{1,4})?::[0-9a-f]{1,4}:|(?:(?:[0-9a-f]{1,4}:){0,4}[0-9a-f]{1,4})?::)(?:[0-9a-f]{1,4}:[0-9a-f]{1,4}|(?:(?:25[0-5]|2[0-4]\d|[01]?\d\d?)\.){3}(?:25[0-5]|2[0-4]\d|[01]?\d\d?))|(?:(?:[0-9a-f]{1,4}:){0,5}[0-9a-f]{1,4})?::[0-9a-f]{1,4}|(?:(?:[0-9a-f]{1,4}:){0,6}[0-9a-f]{1,4})?::)|[Vv][0-9a-f]+\.[a-z0-9\-._~!$&'()*+,;=:]+)\]|(?:(?:25[0-5]|2[0-4]\d|[01]?\d\d?)\.){3}(?:25[0-5]|2[0-4]\d|[01]?\d\d?)|(?:[a-z0-9\-._~!$&'"()*+,;=]|%[0-9a-f]{2})*)(?::\d*)?(?:\/(?:[a-z0-9\-._~!$&'"()*+,;=:@]|%[0-9a-f]{2})*)*|\/(?:(?:[a-z0-9\-._~!$&'"()*+,;=:@]|%[0-9a-f]{2})+(?:\/(?:[a-z0-9\-._~!$&'"()*+,;=:@]|%[0-9a-f]{2})*)*)?|(?:[a-z0-9\-._~!$&'"()*+,;=:@]|%[0-9a-f]{2})+(?:\/(?:[a-z0-9\-._~!$&'"()*+,;=:@]|%[0-9a-f]{2})*)*)?(?:\?(?:[a-z0-9\-._~!$&'"()*+,;=:@/?]|%[0-9a-f]{2})*)?(?:#(?:[a-z0-9\-._~!$&'"()*+,;=:@/?]|%[0-9a-f]{2})*)?$/i;
	// uri-template: https://tools.ietf.org/html/rfc6570
	var URITEMPLATE = /^(?:(?:[^\x00-\x20"'<>%\\^`{|}]|%[0-9a-f]{2})|\{[+#./;?&=,!@|]?(?:[a-z0-9_]|%[0-9a-f]{2})+(?::[1-9][0-9]{0,3}|\*)?(?:,(?:[a-z0-9_]|%[0-9a-f]{2})+(?::[1-9][0-9]{0,3}|\*)?)*\})*$/i;
	// For the source: https://gist.github.com/dperini/729294
	// For test cases: https://mathiasbynens.be/demo/url-regex
	// @todo Delete current URL in favour of the commented out URL rule when this issue is fixed https://github.com/eslint/eslint/issues/7983.
	// var URL = /^(?:(?:https?|ftp):\/\/)(?:\S+(?::\S*)?@)?(?:(?!10(?:\.\d{1,3}){3})(?!127(?:\.\d{1,3}){3})(?!169\.254(?:\.\d{1,3}){2})(?!192\.168(?:\.\d{1,3}){2})(?!172\.(?:1[6-9]|2\d|3[0-1])(?:\.\d{1,3}){2})(?:[1-9]\d?|1\d\d|2[01]\d|22[0-3])(?:\.(?:1?\d{1,2}|2[0-4]\d|25[0-5])){2}(?:\.(?:[1-9]\d?|1\d\d|2[0-4]\d|25[0-4]))|(?:(?:[a-z\u{00a1}-\u{ffff}0-9]+-)*[a-z\u{00a1}-\u{ffff}0-9]+)(?:\.(?:[a-z\u{00a1}-\u{ffff}0-9]+-)*[a-z\u{00a1}-\u{ffff}0-9]+)*(?:\.(?:[a-z\u{00a1}-\u{ffff}]{2,})))(?::\d{2,5})?(?:\/[^\s]*)?$/iu;
	var URL = /^(?:(?:http[s\u017F]?|ftp):\/\/)(?:(?:[\0-\x08\x0E-\x1F!-\x9F\xA1-\u167F\u1681-\u1FFF\u200B-\u2027\u202A-\u202E\u2030-\u205E\u2060-\u2FFF\u3001-\uD7FF\uE000-\uFEFE\uFF00-\uFFFF]|[\uD800-\uDBFF][\uDC00-\uDFFF]|[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?:[^\uD800-\uDBFF]|^)[\uDC00-\uDFFF])+(?::(?:[\0-\x08\x0E-\x1F!-\x9F\xA1-\u167F\u1681-\u1FFF\u200B-\u2027\u202A-\u202E\u2030-\u205E\u2060-\u2FFF\u3001-\uD7FF\uE000-\uFEFE\uFF00-\uFFFF]|[\uD800-\uDBFF][\uDC00-\uDFFF]|[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?:[^\uD800-\uDBFF]|^)[\uDC00-\uDFFF])*)?@)?(?:(?!10(?:\.[0-9]{1,3}){3})(?!127(?:\.[0-9]{1,3}){3})(?!169\.254(?:\.[0-9]{1,3}){2})(?!192\.168(?:\.[0-9]{1,3}){2})(?!172\.(?:1[6-9]|2[0-9]|3[01])(?:\.[0-9]{1,3}){2})(?:[1-9][0-9]?|1[0-9][0-9]|2[01][0-9]|22[0-3])(?:\.(?:1?[0-9]{1,2}|2[0-4][0-9]|25[0-5])){2}(?:\.(?:[1-9][0-9]?|1[0-9][0-9]|2[0-4][0-9]|25[0-4]))|(?:(?:(?:[0-9a-z\xA1-\uD7FF\uE000-\uFFFF]|[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?:[^\uD800-\uDBFF]|^)[\uDC00-\uDFFF])+-)*(?:[0-9a-z\xA1-\uD7FF\uE000-\uFFFF]|[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?:[^\uD800-\uDBFF]|^)[\uDC00-\uDFFF])+)(?:\.(?:(?:[0-9a-z\xA1-\uD7FF\uE000-\uFFFF]|[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?:[^\uD800-\uDBFF]|^)[\uDC00-\uDFFF])+-)*(?:[0-9a-z\xA1-\uD7FF\uE000-\uFFFF]|[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?:[^\uD800-\uDBFF]|^)[\uDC00-\uDFFF])+)*(?:\.(?:(?:[a-z\xA1-\uD7FF\uE000-\uFFFF]|[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?:[^\uD800-\uDBFF]|^)[\uDC00-\uDFFF]){2,})))(?::[0-9]{2,5})?(?:\/(?:[\0-\x08\x0E-\x1F!-\x9F\xA1-\u167F\u1681-\u1FFF\u200B-\u2027\u202A-\u202E\u2030-\u205E\u2060-\u2FFF\u3001-\uD7FF\uE000-\uFEFE\uFF00-\uFFFF]|[\uD800-\uDBFF][\uDC00-\uDFFF]|[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?:[^\uD800-\uDBFF]|^)[\uDC00-\uDFFF])*)?$/i;
	var UUID = /^(?:urn:uuid:)?[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/i;
	var JSON_POINTER = /^(?:\/(?:[^~/]|~0|~1)*)*$/;
	var JSON_POINTER_URI_FRAGMENT = /^#(?:\/(?:[a-z0-9_\-.!$&'()*+,;:=@]|%[0-9a-f]{2}|~0|~1)*)*$/i;
	var RELATIVE_JSON_POINTER = /^(?:0|[1-9][0-9]*)(?:#|(?:\/(?:[^~/]|~0|~1)*)*)$/;


	formats_1 = formats;

	function formats(mode) {
	  mode = mode == 'full' ? 'full' : 'fast';
	  return util.copy(formats[mode]);
	}


	formats.fast = {
	  // date: http://tools.ietf.org/html/rfc3339#section-5.6
	  date: /^\d\d\d\d-[0-1]\d-[0-3]\d$/,
	  // date-time: http://tools.ietf.org/html/rfc3339#section-5.6
	  time: /^(?:[0-2]\d:[0-5]\d:[0-5]\d|23:59:60)(?:\.\d+)?(?:z|[+-]\d\d(?::?\d\d)?)?$/i,
	  'date-time': /^\d\d\d\d-[0-1]\d-[0-3]\d[t\s](?:[0-2]\d:[0-5]\d:[0-5]\d|23:59:60)(?:\.\d+)?(?:z|[+-]\d\d(?::?\d\d)?)$/i,
	  // uri: https://github.com/mafintosh/is-my-json-valid/blob/master/formats.js
	  uri: /^(?:[a-z][a-z0-9+\-.]*:)(?:\/?\/)?[^\s]*$/i,
	  'uri-reference': /^(?:(?:[a-z][a-z0-9+\-.]*:)?\/?\/)?(?:[^\\\s#][^\s#]*)?(?:#[^\\\s]*)?$/i,
	  'uri-template': URITEMPLATE,
	  url: URL,
	  // email (sources from jsen validator):
	  // http://stackoverflow.com/questions/201323/using-a-regular-expression-to-validate-an-email-address#answer-8829363
	  // http://www.w3.org/TR/html5/forms.html#valid-e-mail-address (search for 'willful violation')
	  email: /^[a-z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?)*$/i,
	  hostname: HOSTNAME,
	  // optimized https://www.safaribooksonline.com/library/view/regular-expressions-cookbook/9780596802837/ch07s16.html
	  ipv4: /^(?:(?:25[0-5]|2[0-4]\d|[01]?\d\d?)\.){3}(?:25[0-5]|2[0-4]\d|[01]?\d\d?)$/,
	  // optimized http://stackoverflow.com/questions/53497/regular-expression-that-matches-valid-ipv6-addresses
	  ipv6: /^\s*(?:(?:(?:[0-9a-f]{1,4}:){7}(?:[0-9a-f]{1,4}|:))|(?:(?:[0-9a-f]{1,4}:){6}(?::[0-9a-f]{1,4}|(?:(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(?:\.(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3})|:))|(?:(?:[0-9a-f]{1,4}:){5}(?:(?:(?::[0-9a-f]{1,4}){1,2})|:(?:(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(?:\.(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3})|:))|(?:(?:[0-9a-f]{1,4}:){4}(?:(?:(?::[0-9a-f]{1,4}){1,3})|(?:(?::[0-9a-f]{1,4})?:(?:(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(?:\.(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(?:(?:[0-9a-f]{1,4}:){3}(?:(?:(?::[0-9a-f]{1,4}){1,4})|(?:(?::[0-9a-f]{1,4}){0,2}:(?:(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(?:\.(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(?:(?:[0-9a-f]{1,4}:){2}(?:(?:(?::[0-9a-f]{1,4}){1,5})|(?:(?::[0-9a-f]{1,4}){0,3}:(?:(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(?:\.(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(?:(?:[0-9a-f]{1,4}:){1}(?:(?:(?::[0-9a-f]{1,4}){1,6})|(?:(?::[0-9a-f]{1,4}){0,4}:(?:(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(?:\.(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(?::(?:(?:(?::[0-9a-f]{1,4}){1,7})|(?:(?::[0-9a-f]{1,4}){0,5}:(?:(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(?:\.(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:)))(?:%.+)?\s*$/i,
	  regex: regex,
	  // uuid: http://tools.ietf.org/html/rfc4122
	  uuid: UUID,
	  // JSON-pointer: https://tools.ietf.org/html/rfc6901
	  // uri fragment: https://tools.ietf.org/html/rfc3986#appendix-A
	  'json-pointer': JSON_POINTER,
	  'json-pointer-uri-fragment': JSON_POINTER_URI_FRAGMENT,
	  // relative JSON-pointer: http://tools.ietf.org/html/draft-luff-relative-json-pointer-00
	  'relative-json-pointer': RELATIVE_JSON_POINTER
	};


	formats.full = {
	  date: date,
	  time: time,
	  'date-time': date_time,
	  uri: uri,
	  'uri-reference': URIREF,
	  'uri-template': URITEMPLATE,
	  url: URL,
	  email: /^[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/i,
	  hostname: HOSTNAME,
	  ipv4: /^(?:(?:25[0-5]|2[0-4]\d|[01]?\d\d?)\.){3}(?:25[0-5]|2[0-4]\d|[01]?\d\d?)$/,
	  ipv6: /^\s*(?:(?:(?:[0-9a-f]{1,4}:){7}(?:[0-9a-f]{1,4}|:))|(?:(?:[0-9a-f]{1,4}:){6}(?::[0-9a-f]{1,4}|(?:(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(?:\.(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3})|:))|(?:(?:[0-9a-f]{1,4}:){5}(?:(?:(?::[0-9a-f]{1,4}){1,2})|:(?:(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(?:\.(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3})|:))|(?:(?:[0-9a-f]{1,4}:){4}(?:(?:(?::[0-9a-f]{1,4}){1,3})|(?:(?::[0-9a-f]{1,4})?:(?:(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(?:\.(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(?:(?:[0-9a-f]{1,4}:){3}(?:(?:(?::[0-9a-f]{1,4}){1,4})|(?:(?::[0-9a-f]{1,4}){0,2}:(?:(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(?:\.(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(?:(?:[0-9a-f]{1,4}:){2}(?:(?:(?::[0-9a-f]{1,4}){1,5})|(?:(?::[0-9a-f]{1,4}){0,3}:(?:(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(?:\.(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(?:(?:[0-9a-f]{1,4}:){1}(?:(?:(?::[0-9a-f]{1,4}){1,6})|(?:(?::[0-9a-f]{1,4}){0,4}:(?:(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(?:\.(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(?::(?:(?:(?::[0-9a-f]{1,4}){1,7})|(?:(?::[0-9a-f]{1,4}){0,5}:(?:(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(?:\.(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:)))(?:%.+)?\s*$/i,
	  regex: regex,
	  uuid: UUID,
	  'json-pointer': JSON_POINTER,
	  'json-pointer-uri-fragment': JSON_POINTER_URI_FRAGMENT,
	  'relative-json-pointer': RELATIVE_JSON_POINTER
	};


	function isLeapYear(year) {
	  // https://tools.ietf.org/html/rfc3339#appendix-C
	  return year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
	}


	function date(str) {
	  // full-date from http://tools.ietf.org/html/rfc3339#section-5.6
	  var matches = str.match(DATE);
	  if (!matches) return false;

	  var year = +matches[1];
	  var month = +matches[2];
	  var day = +matches[3];

	  return month >= 1 && month <= 12 && day >= 1 &&
	          day <= (month == 2 && isLeapYear(year) ? 29 : DAYS[month]);
	}


	function time(str, full) {
	  var matches = str.match(TIME);
	  if (!matches) return false;

	  var hour = matches[1];
	  var minute = matches[2];
	  var second = matches[3];
	  var timeZone = matches[5];
	  return ((hour <= 23 && minute <= 59 && second <= 59) ||
	          (hour == 23 && minute == 59 && second == 60)) &&
	         (!full || timeZone);
	}


	var DATE_TIME_SEPARATOR = /t|\s/i;
	function date_time(str) {
	  // http://tools.ietf.org/html/rfc3339#section-5.6
	  var dateTime = str.split(DATE_TIME_SEPARATOR);
	  return dateTime.length == 2 && date(dateTime[0]) && time(dateTime[1], true);
	}


	var NOT_URI_FRAGMENT = /\/|:/;
	function uri(str) {
	  // http://jmrware.com/articles/2009/uri_regexp/URI_regex.html + optional protocol + required "."
	  return NOT_URI_FRAGMENT.test(str) && URI.test(str);
	}


	var Z_ANCHOR = /[^\\]\\Z/;
	function regex(str) {
	  if (Z_ANCHOR.test(str)) return false;
	  try {
	    new RegExp(str);
	    return true;
	  } catch(e) {
	    return false;
	  }
	}
	return formats_1;
}

var ref;
var hasRequiredRef;

function requireRef () {
	if (hasRequiredRef) return ref;
	hasRequiredRef = 1;
	ref = function generate_ref(it, $keyword, $ruleType) {
	  var out = ' ';
	  var $lvl = it.level;
	  var $dataLvl = it.dataLevel;
	  var $schema = it.schema[$keyword];
	  var $errSchemaPath = it.errSchemaPath + '/' + $keyword;
	  var $breakOnError = !it.opts.allErrors;
	  var $data = 'data' + ($dataLvl || '');
	  var $valid = 'valid' + $lvl;
	  var $async, $refCode;
	  if ($schema == '#' || $schema == '#/') {
	    if (it.isRoot) {
	      $async = it.async;
	      $refCode = 'validate';
	    } else {
	      $async = it.root.schema.$async === true;
	      $refCode = 'root.refVal[0]';
	    }
	  } else {
	    var $refVal = it.resolveRef(it.baseId, $schema, it.isRoot);
	    if ($refVal === undefined) {
	      var $message = it.MissingRefError.message(it.baseId, $schema);
	      if (it.opts.missingRefs == 'fail') {
	        it.logger.error($message);
	        var $$outStack = $$outStack || [];
	        $$outStack.push(out);
	        out = ''; /* istanbul ignore else */
	        if (it.createErrors !== false) {
	          out += ' { keyword: \'' + ('$ref') + '\' , dataPath: (dataPath || \'\') + ' + (it.errorPath) + ' , schemaPath: ' + (it.util.toQuotedString($errSchemaPath)) + ' , params: { ref: \'' + (it.util.escapeQuotes($schema)) + '\' } ';
	          if (it.opts.messages !== false) {
	            out += ' , message: \'can\\\'t resolve reference ' + (it.util.escapeQuotes($schema)) + '\' ';
	          }
	          if (it.opts.verbose) {
	            out += ' , schema: ' + (it.util.toQuotedString($schema)) + ' , parentSchema: validate.schema' + (it.schemaPath) + ' , data: ' + ($data) + ' ';
	          }
	          out += ' } ';
	        } else {
	          out += ' {} ';
	        }
	        var __err = out;
	        out = $$outStack.pop();
	        if (!it.compositeRule && $breakOnError) {
	          /* istanbul ignore if */
	          if (it.async) {
	            out += ' throw new ValidationError([' + (__err) + ']); ';
	          } else {
	            out += ' validate.errors = [' + (__err) + ']; return false; ';
	          }
	        } else {
	          out += ' var err = ' + (__err) + ';  if (vErrors === null) vErrors = [err]; else vErrors.push(err); errors++; ';
	        }
	        if ($breakOnError) {
	          out += ' if (false) { ';
	        }
	      } else if (it.opts.missingRefs == 'ignore') {
	        it.logger.warn($message);
	        if ($breakOnError) {
	          out += ' if (true) { ';
	        }
	      } else {
	        throw new it.MissingRefError(it.baseId, $schema, $message);
	      }
	    } else if ($refVal.inline) {
	      var $it = it.util.copy(it);
	      $it.level++;
	      var $nextValid = 'valid' + $it.level;
	      $it.schema = $refVal.schema;
	      $it.schemaPath = '';
	      $it.errSchemaPath = $schema;
	      var $code = it.validate($it).replace(/validate\.schema/g, $refVal.code);
	      out += ' ' + ($code) + ' ';
	      if ($breakOnError) {
	        out += ' if (' + ($nextValid) + ') { ';
	      }
	    } else {
	      $async = $refVal.$async === true || (it.async && $refVal.$async !== false);
	      $refCode = $refVal.code;
	    }
	  }
	  if ($refCode) {
	    var $$outStack = $$outStack || [];
	    $$outStack.push(out);
	    out = '';
	    if (it.opts.passContext) {
	      out += ' ' + ($refCode) + '.call(this, ';
	    } else {
	      out += ' ' + ($refCode) + '( ';
	    }
	    out += ' ' + ($data) + ', (dataPath || \'\')';
	    if (it.errorPath != '""') {
	      out += ' + ' + (it.errorPath);
	    }
	    var $parentData = $dataLvl ? 'data' + (($dataLvl - 1) || '') : 'parentData',
	      $parentDataProperty = $dataLvl ? it.dataPathArr[$dataLvl] : 'parentDataProperty';
	    out += ' , ' + ($parentData) + ' , ' + ($parentDataProperty) + ', rootData)  ';
	    var __callValidate = out;
	    out = $$outStack.pop();
	    if ($async) {
	      if (!it.async) throw new Error('async schema referenced by sync schema');
	      if ($breakOnError) {
	        out += ' var ' + ($valid) + '; ';
	      }
	      out += ' try { await ' + (__callValidate) + '; ';
	      if ($breakOnError) {
	        out += ' ' + ($valid) + ' = true; ';
	      }
	      out += ' } catch (e) { if (!(e instanceof ValidationError)) throw e; if (vErrors === null) vErrors = e.errors; else vErrors = vErrors.concat(e.errors); errors = vErrors.length; ';
	      if ($breakOnError) {
	        out += ' ' + ($valid) + ' = false; ';
	      }
	      out += ' } ';
	      if ($breakOnError) {
	        out += ' if (' + ($valid) + ') { ';
	      }
	    } else {
	      out += ' if (!' + (__callValidate) + ') { if (vErrors === null) vErrors = ' + ($refCode) + '.errors; else vErrors = vErrors.concat(' + ($refCode) + '.errors); errors = vErrors.length; } ';
	      if ($breakOnError) {
	        out += ' else { ';
	      }
	    }
	  }
	  return out;
	};
	return ref;
}

var allOf;
var hasRequiredAllOf;

function requireAllOf () {
	if (hasRequiredAllOf) return allOf;
	hasRequiredAllOf = 1;
	allOf = function generate_allOf(it, $keyword, $ruleType) {
	  var out = ' ';
	  var $schema = it.schema[$keyword];
	  var $schemaPath = it.schemaPath + it.util.getProperty($keyword);
	  var $errSchemaPath = it.errSchemaPath + '/' + $keyword;
	  var $breakOnError = !it.opts.allErrors;
	  var $it = it.util.copy(it);
	  var $closingBraces = '';
	  $it.level++;
	  var $nextValid = 'valid' + $it.level;
	  var $currentBaseId = $it.baseId,
	    $allSchemasEmpty = true;
	  var arr1 = $schema;
	  if (arr1) {
	    var $sch, $i = -1,
	      l1 = arr1.length - 1;
	    while ($i < l1) {
	      $sch = arr1[$i += 1];
	      if ((it.opts.strictKeywords ? (typeof $sch == 'object' && Object.keys($sch).length > 0) || $sch === false : it.util.schemaHasRules($sch, it.RULES.all))) {
	        $allSchemasEmpty = false;
	        $it.schema = $sch;
	        $it.schemaPath = $schemaPath + '[' + $i + ']';
	        $it.errSchemaPath = $errSchemaPath + '/' + $i;
	        out += '  ' + (it.validate($it)) + ' ';
	        $it.baseId = $currentBaseId;
	        if ($breakOnError) {
	          out += ' if (' + ($nextValid) + ') { ';
	          $closingBraces += '}';
	        }
	      }
	    }
	  }
	  if ($breakOnError) {
	    if ($allSchemasEmpty) {
	      out += ' if (true) { ';
	    } else {
	      out += ' ' + ($closingBraces.slice(0, -1)) + ' ';
	    }
	  }
	  return out;
	};
	return allOf;
}

var anyOf;
var hasRequiredAnyOf;

function requireAnyOf () {
	if (hasRequiredAnyOf) return anyOf;
	hasRequiredAnyOf = 1;
	anyOf = function generate_anyOf(it, $keyword, $ruleType) {
	  var out = ' ';
	  var $lvl = it.level;
	  var $dataLvl = it.dataLevel;
	  var $schema = it.schema[$keyword];
	  var $schemaPath = it.schemaPath + it.util.getProperty($keyword);
	  var $errSchemaPath = it.errSchemaPath + '/' + $keyword;
	  var $breakOnError = !it.opts.allErrors;
	  var $data = 'data' + ($dataLvl || '');
	  var $valid = 'valid' + $lvl;
	  var $errs = 'errs__' + $lvl;
	  var $it = it.util.copy(it);
	  var $closingBraces = '';
	  $it.level++;
	  var $nextValid = 'valid' + $it.level;
	  var $noEmptySchema = $schema.every(function($sch) {
	    return (it.opts.strictKeywords ? (typeof $sch == 'object' && Object.keys($sch).length > 0) || $sch === false : it.util.schemaHasRules($sch, it.RULES.all));
	  });
	  if ($noEmptySchema) {
	    var $currentBaseId = $it.baseId;
	    out += ' var ' + ($errs) + ' = errors; var ' + ($valid) + ' = false;  ';
	    var $wasComposite = it.compositeRule;
	    it.compositeRule = $it.compositeRule = true;
	    var arr1 = $schema;
	    if (arr1) {
	      var $sch, $i = -1,
	        l1 = arr1.length - 1;
	      while ($i < l1) {
	        $sch = arr1[$i += 1];
	        $it.schema = $sch;
	        $it.schemaPath = $schemaPath + '[' + $i + ']';
	        $it.errSchemaPath = $errSchemaPath + '/' + $i;
	        out += '  ' + (it.validate($it)) + ' ';
	        $it.baseId = $currentBaseId;
	        out += ' ' + ($valid) + ' = ' + ($valid) + ' || ' + ($nextValid) + '; if (!' + ($valid) + ') { ';
	        $closingBraces += '}';
	      }
	    }
	    it.compositeRule = $it.compositeRule = $wasComposite;
	    out += ' ' + ($closingBraces) + ' if (!' + ($valid) + ') {   var err =   '; /* istanbul ignore else */
	    if (it.createErrors !== false) {
	      out += ' { keyword: \'' + ('anyOf') + '\' , dataPath: (dataPath || \'\') + ' + (it.errorPath) + ' , schemaPath: ' + (it.util.toQuotedString($errSchemaPath)) + ' , params: {} ';
	      if (it.opts.messages !== false) {
	        out += ' , message: \'should match some schema in anyOf\' ';
	      }
	      if (it.opts.verbose) {
	        out += ' , schema: validate.schema' + ($schemaPath) + ' , parentSchema: validate.schema' + (it.schemaPath) + ' , data: ' + ($data) + ' ';
	      }
	      out += ' } ';
	    } else {
	      out += ' {} ';
	    }
	    out += ';  if (vErrors === null) vErrors = [err]; else vErrors.push(err); errors++; ';
	    if (!it.compositeRule && $breakOnError) {
	      /* istanbul ignore if */
	      if (it.async) {
	        out += ' throw new ValidationError(vErrors); ';
	      } else {
	        out += ' validate.errors = vErrors; return false; ';
	      }
	    }
	    out += ' } else {  errors = ' + ($errs) + '; if (vErrors !== null) { if (' + ($errs) + ') vErrors.length = ' + ($errs) + '; else vErrors = null; } ';
	    if (it.opts.allErrors) {
	      out += ' } ';
	    }
	  } else {
	    if ($breakOnError) {
	      out += ' if (true) { ';
	    }
	  }
	  return out;
	};
	return anyOf;
}

var comment;
var hasRequiredComment;

function requireComment () {
	if (hasRequiredComment) return comment;
	hasRequiredComment = 1;
	comment = function generate_comment(it, $keyword, $ruleType) {
	  var out = ' ';
	  var $schema = it.schema[$keyword];
	  var $errSchemaPath = it.errSchemaPath + '/' + $keyword;
	  !it.opts.allErrors;
	  var $comment = it.util.toQuotedString($schema);
	  if (it.opts.$comment === true) {
	    out += ' console.log(' + ($comment) + ');';
	  } else if (typeof it.opts.$comment == 'function') {
	    out += ' self._opts.$comment(' + ($comment) + ', ' + (it.util.toQuotedString($errSchemaPath)) + ', validate.root.schema);';
	  }
	  return out;
	};
	return comment;
}

var _const;
var hasRequired_const;

function require_const () {
	if (hasRequired_const) return _const;
	hasRequired_const = 1;
	_const = function generate_const(it, $keyword, $ruleType) {
	  var out = ' ';
	  var $lvl = it.level;
	  var $dataLvl = it.dataLevel;
	  var $schema = it.schema[$keyword];
	  var $schemaPath = it.schemaPath + it.util.getProperty($keyword);
	  var $errSchemaPath = it.errSchemaPath + '/' + $keyword;
	  var $breakOnError = !it.opts.allErrors;
	  var $data = 'data' + ($dataLvl || '');
	  var $valid = 'valid' + $lvl;
	  var $isData = it.opts.$data && $schema && $schema.$data;
	  if ($isData) {
	    out += ' var schema' + ($lvl) + ' = ' + (it.util.getData($schema.$data, $dataLvl, it.dataPathArr)) + '; ';
	  }
	  if (!$isData) {
	    out += ' var schema' + ($lvl) + ' = validate.schema' + ($schemaPath) + ';';
	  }
	  out += 'var ' + ($valid) + ' = equal(' + ($data) + ', schema' + ($lvl) + '); if (!' + ($valid) + ') {   ';
	  var $$outStack = $$outStack || [];
	  $$outStack.push(out);
	  out = ''; /* istanbul ignore else */
	  if (it.createErrors !== false) {
	    out += ' { keyword: \'' + ('const') + '\' , dataPath: (dataPath || \'\') + ' + (it.errorPath) + ' , schemaPath: ' + (it.util.toQuotedString($errSchemaPath)) + ' , params: { allowedValue: schema' + ($lvl) + ' } ';
	    if (it.opts.messages !== false) {
	      out += ' , message: \'should be equal to constant\' ';
	    }
	    if (it.opts.verbose) {
	      out += ' , schema: validate.schema' + ($schemaPath) + ' , parentSchema: validate.schema' + (it.schemaPath) + ' , data: ' + ($data) + ' ';
	    }
	    out += ' } ';
	  } else {
	    out += ' {} ';
	  }
	  var __err = out;
	  out = $$outStack.pop();
	  if (!it.compositeRule && $breakOnError) {
	    /* istanbul ignore if */
	    if (it.async) {
	      out += ' throw new ValidationError([' + (__err) + ']); ';
	    } else {
	      out += ' validate.errors = [' + (__err) + ']; return false; ';
	    }
	  } else {
	    out += ' var err = ' + (__err) + ';  if (vErrors === null) vErrors = [err]; else vErrors.push(err); errors++; ';
	  }
	  out += ' }';
	  if ($breakOnError) {
	    out += ' else { ';
	  }
	  return out;
	};
	return _const;
}

var contains;
var hasRequiredContains;

function requireContains () {
	if (hasRequiredContains) return contains;
	hasRequiredContains = 1;
	contains = function generate_contains(it, $keyword, $ruleType) {
	  var out = ' ';
	  var $lvl = it.level;
	  var $dataLvl = it.dataLevel;
	  var $schema = it.schema[$keyword];
	  var $schemaPath = it.schemaPath + it.util.getProperty($keyword);
	  var $errSchemaPath = it.errSchemaPath + '/' + $keyword;
	  var $breakOnError = !it.opts.allErrors;
	  var $data = 'data' + ($dataLvl || '');
	  var $valid = 'valid' + $lvl;
	  var $errs = 'errs__' + $lvl;
	  var $it = it.util.copy(it);
	  var $closingBraces = '';
	  $it.level++;
	  var $nextValid = 'valid' + $it.level;
	  var $idx = 'i' + $lvl,
	    $dataNxt = $it.dataLevel = it.dataLevel + 1,
	    $nextData = 'data' + $dataNxt,
	    $currentBaseId = it.baseId,
	    $nonEmptySchema = (it.opts.strictKeywords ? (typeof $schema == 'object' && Object.keys($schema).length > 0) || $schema === false : it.util.schemaHasRules($schema, it.RULES.all));
	  out += 'var ' + ($errs) + ' = errors;var ' + ($valid) + ';';
	  if ($nonEmptySchema) {
	    var $wasComposite = it.compositeRule;
	    it.compositeRule = $it.compositeRule = true;
	    $it.schema = $schema;
	    $it.schemaPath = $schemaPath;
	    $it.errSchemaPath = $errSchemaPath;
	    out += ' var ' + ($nextValid) + ' = false; for (var ' + ($idx) + ' = 0; ' + ($idx) + ' < ' + ($data) + '.length; ' + ($idx) + '++) { ';
	    $it.errorPath = it.util.getPathExpr(it.errorPath, $idx, it.opts.jsonPointers, true);
	    var $passData = $data + '[' + $idx + ']';
	    $it.dataPathArr[$dataNxt] = $idx;
	    var $code = it.validate($it);
	    $it.baseId = $currentBaseId;
	    if (it.util.varOccurences($code, $nextData) < 2) {
	      out += ' ' + (it.util.varReplace($code, $nextData, $passData)) + ' ';
	    } else {
	      out += ' var ' + ($nextData) + ' = ' + ($passData) + '; ' + ($code) + ' ';
	    }
	    out += ' if (' + ($nextValid) + ') break; }  ';
	    it.compositeRule = $it.compositeRule = $wasComposite;
	    out += ' ' + ($closingBraces) + ' if (!' + ($nextValid) + ') {';
	  } else {
	    out += ' if (' + ($data) + '.length == 0) {';
	  }
	  var $$outStack = $$outStack || [];
	  $$outStack.push(out);
	  out = ''; /* istanbul ignore else */
	  if (it.createErrors !== false) {
	    out += ' { keyword: \'' + ('contains') + '\' , dataPath: (dataPath || \'\') + ' + (it.errorPath) + ' , schemaPath: ' + (it.util.toQuotedString($errSchemaPath)) + ' , params: {} ';
	    if (it.opts.messages !== false) {
	      out += ' , message: \'should contain a valid item\' ';
	    }
	    if (it.opts.verbose) {
	      out += ' , schema: validate.schema' + ($schemaPath) + ' , parentSchema: validate.schema' + (it.schemaPath) + ' , data: ' + ($data) + ' ';
	    }
	    out += ' } ';
	  } else {
	    out += ' {} ';
	  }
	  var __err = out;
	  out = $$outStack.pop();
	  if (!it.compositeRule && $breakOnError) {
	    /* istanbul ignore if */
	    if (it.async) {
	      out += ' throw new ValidationError([' + (__err) + ']); ';
	    } else {
	      out += ' validate.errors = [' + (__err) + ']; return false; ';
	    }
	  } else {
	    out += ' var err = ' + (__err) + ';  if (vErrors === null) vErrors = [err]; else vErrors.push(err); errors++; ';
	  }
	  out += ' } else { ';
	  if ($nonEmptySchema) {
	    out += '  errors = ' + ($errs) + '; if (vErrors !== null) { if (' + ($errs) + ') vErrors.length = ' + ($errs) + '; else vErrors = null; } ';
	  }
	  if (it.opts.allErrors) {
	    out += ' } ';
	  }
	  return out;
	};
	return contains;
}

var dependencies;
var hasRequiredDependencies;

function requireDependencies () {
	if (hasRequiredDependencies) return dependencies;
	hasRequiredDependencies = 1;
	dependencies = function generate_dependencies(it, $keyword, $ruleType) {
	  var out = ' ';
	  var $lvl = it.level;
	  var $dataLvl = it.dataLevel;
	  var $schema = it.schema[$keyword];
	  var $schemaPath = it.schemaPath + it.util.getProperty($keyword);
	  var $errSchemaPath = it.errSchemaPath + '/' + $keyword;
	  var $breakOnError = !it.opts.allErrors;
	  var $data = 'data' + ($dataLvl || '');
	  var $errs = 'errs__' + $lvl;
	  var $it = it.util.copy(it);
	  var $closingBraces = '';
	  $it.level++;
	  var $nextValid = 'valid' + $it.level;
	  var $schemaDeps = {},
	    $propertyDeps = {},
	    $ownProperties = it.opts.ownProperties;
	  for ($property in $schema) {
	    if ($property == '__proto__') continue;
	    var $sch = $schema[$property];
	    var $deps = Array.isArray($sch) ? $propertyDeps : $schemaDeps;
	    $deps[$property] = $sch;
	  }
	  out += 'var ' + ($errs) + ' = errors;';
	  var $currentErrorPath = it.errorPath;
	  out += 'var missing' + ($lvl) + ';';
	  for (var $property in $propertyDeps) {
	    $deps = $propertyDeps[$property];
	    if ($deps.length) {
	      out += ' if ( ' + ($data) + (it.util.getProperty($property)) + ' !== undefined ';
	      if ($ownProperties) {
	        out += ' && Object.prototype.hasOwnProperty.call(' + ($data) + ', \'' + (it.util.escapeQuotes($property)) + '\') ';
	      }
	      if ($breakOnError) {
	        out += ' && ( ';
	        var arr1 = $deps;
	        if (arr1) {
	          var $propertyKey, $i = -1,
	            l1 = arr1.length - 1;
	          while ($i < l1) {
	            $propertyKey = arr1[$i += 1];
	            if ($i) {
	              out += ' || ';
	            }
	            var $prop = it.util.getProperty($propertyKey),
	              $useData = $data + $prop;
	            out += ' ( ( ' + ($useData) + ' === undefined ';
	            if ($ownProperties) {
	              out += ' || ! Object.prototype.hasOwnProperty.call(' + ($data) + ', \'' + (it.util.escapeQuotes($propertyKey)) + '\') ';
	            }
	            out += ') && (missing' + ($lvl) + ' = ' + (it.util.toQuotedString(it.opts.jsonPointers ? $propertyKey : $prop)) + ') ) ';
	          }
	        }
	        out += ')) {  ';
	        var $propertyPath = 'missing' + $lvl,
	          $missingProperty = '\' + ' + $propertyPath + ' + \'';
	        if (it.opts._errorDataPathProperty) {
	          it.errorPath = it.opts.jsonPointers ? it.util.getPathExpr($currentErrorPath, $propertyPath, true) : $currentErrorPath + ' + ' + $propertyPath;
	        }
	        var $$outStack = $$outStack || [];
	        $$outStack.push(out);
	        out = ''; /* istanbul ignore else */
	        if (it.createErrors !== false) {
	          out += ' { keyword: \'' + ('dependencies') + '\' , dataPath: (dataPath || \'\') + ' + (it.errorPath) + ' , schemaPath: ' + (it.util.toQuotedString($errSchemaPath)) + ' , params: { property: \'' + (it.util.escapeQuotes($property)) + '\', missingProperty: \'' + ($missingProperty) + '\', depsCount: ' + ($deps.length) + ', deps: \'' + (it.util.escapeQuotes($deps.length == 1 ? $deps[0] : $deps.join(", "))) + '\' } ';
	          if (it.opts.messages !== false) {
	            out += ' , message: \'should have ';
	            if ($deps.length == 1) {
	              out += 'property ' + (it.util.escapeQuotes($deps[0]));
	            } else {
	              out += 'properties ' + (it.util.escapeQuotes($deps.join(", ")));
	            }
	            out += ' when property ' + (it.util.escapeQuotes($property)) + ' is present\' ';
	          }
	          if (it.opts.verbose) {
	            out += ' , schema: validate.schema' + ($schemaPath) + ' , parentSchema: validate.schema' + (it.schemaPath) + ' , data: ' + ($data) + ' ';
	          }
	          out += ' } ';
	        } else {
	          out += ' {} ';
	        }
	        var __err = out;
	        out = $$outStack.pop();
	        if (!it.compositeRule && $breakOnError) {
	          /* istanbul ignore if */
	          if (it.async) {
	            out += ' throw new ValidationError([' + (__err) + ']); ';
	          } else {
	            out += ' validate.errors = [' + (__err) + ']; return false; ';
	          }
	        } else {
	          out += ' var err = ' + (__err) + ';  if (vErrors === null) vErrors = [err]; else vErrors.push(err); errors++; ';
	        }
	      } else {
	        out += ' ) { ';
	        var arr2 = $deps;
	        if (arr2) {
	          var $propertyKey, i2 = -1,
	            l2 = arr2.length - 1;
	          while (i2 < l2) {
	            $propertyKey = arr2[i2 += 1];
	            var $prop = it.util.getProperty($propertyKey),
	              $missingProperty = it.util.escapeQuotes($propertyKey),
	              $useData = $data + $prop;
	            if (it.opts._errorDataPathProperty) {
	              it.errorPath = it.util.getPath($currentErrorPath, $propertyKey, it.opts.jsonPointers);
	            }
	            out += ' if ( ' + ($useData) + ' === undefined ';
	            if ($ownProperties) {
	              out += ' || ! Object.prototype.hasOwnProperty.call(' + ($data) + ', \'' + (it.util.escapeQuotes($propertyKey)) + '\') ';
	            }
	            out += ') {  var err =   '; /* istanbul ignore else */
	            if (it.createErrors !== false) {
	              out += ' { keyword: \'' + ('dependencies') + '\' , dataPath: (dataPath || \'\') + ' + (it.errorPath) + ' , schemaPath: ' + (it.util.toQuotedString($errSchemaPath)) + ' , params: { property: \'' + (it.util.escapeQuotes($property)) + '\', missingProperty: \'' + ($missingProperty) + '\', depsCount: ' + ($deps.length) + ', deps: \'' + (it.util.escapeQuotes($deps.length == 1 ? $deps[0] : $deps.join(", "))) + '\' } ';
	              if (it.opts.messages !== false) {
	                out += ' , message: \'should have ';
	                if ($deps.length == 1) {
	                  out += 'property ' + (it.util.escapeQuotes($deps[0]));
	                } else {
	                  out += 'properties ' + (it.util.escapeQuotes($deps.join(", ")));
	                }
	                out += ' when property ' + (it.util.escapeQuotes($property)) + ' is present\' ';
	              }
	              if (it.opts.verbose) {
	                out += ' , schema: validate.schema' + ($schemaPath) + ' , parentSchema: validate.schema' + (it.schemaPath) + ' , data: ' + ($data) + ' ';
	              }
	              out += ' } ';
	            } else {
	              out += ' {} ';
	            }
	            out += ';  if (vErrors === null) vErrors = [err]; else vErrors.push(err); errors++; } ';
	          }
	        }
	      }
	      out += ' }   ';
	      if ($breakOnError) {
	        $closingBraces += '}';
	        out += ' else { ';
	      }
	    }
	  }
	  it.errorPath = $currentErrorPath;
	  var $currentBaseId = $it.baseId;
	  for (var $property in $schemaDeps) {
	    var $sch = $schemaDeps[$property];
	    if ((it.opts.strictKeywords ? (typeof $sch == 'object' && Object.keys($sch).length > 0) || $sch === false : it.util.schemaHasRules($sch, it.RULES.all))) {
	      out += ' ' + ($nextValid) + ' = true; if ( ' + ($data) + (it.util.getProperty($property)) + ' !== undefined ';
	      if ($ownProperties) {
	        out += ' && Object.prototype.hasOwnProperty.call(' + ($data) + ', \'' + (it.util.escapeQuotes($property)) + '\') ';
	      }
	      out += ') { ';
	      $it.schema = $sch;
	      $it.schemaPath = $schemaPath + it.util.getProperty($property);
	      $it.errSchemaPath = $errSchemaPath + '/' + it.util.escapeFragment($property);
	      out += '  ' + (it.validate($it)) + ' ';
	      $it.baseId = $currentBaseId;
	      out += ' }  ';
	      if ($breakOnError) {
	        out += ' if (' + ($nextValid) + ') { ';
	        $closingBraces += '}';
	      }
	    }
	  }
	  if ($breakOnError) {
	    out += '   ' + ($closingBraces) + ' if (' + ($errs) + ' == errors) {';
	  }
	  return out;
	};
	return dependencies;
}

var _enum;
var hasRequired_enum;

function require_enum () {
	if (hasRequired_enum) return _enum;
	hasRequired_enum = 1;
	_enum = function generate_enum(it, $keyword, $ruleType) {
	  var out = ' ';
	  var $lvl = it.level;
	  var $dataLvl = it.dataLevel;
	  var $schema = it.schema[$keyword];
	  var $schemaPath = it.schemaPath + it.util.getProperty($keyword);
	  var $errSchemaPath = it.errSchemaPath + '/' + $keyword;
	  var $breakOnError = !it.opts.allErrors;
	  var $data = 'data' + ($dataLvl || '');
	  var $valid = 'valid' + $lvl;
	  var $isData = it.opts.$data && $schema && $schema.$data;
	  if ($isData) {
	    out += ' var schema' + ($lvl) + ' = ' + (it.util.getData($schema.$data, $dataLvl, it.dataPathArr)) + '; ';
	  }
	  var $i = 'i' + $lvl,
	    $vSchema = 'schema' + $lvl;
	  if (!$isData) {
	    out += ' var ' + ($vSchema) + ' = validate.schema' + ($schemaPath) + ';';
	  }
	  out += 'var ' + ($valid) + ';';
	  if ($isData) {
	    out += ' if (schema' + ($lvl) + ' === undefined) ' + ($valid) + ' = true; else if (!Array.isArray(schema' + ($lvl) + ')) ' + ($valid) + ' = false; else {';
	  }
	  out += '' + ($valid) + ' = false;for (var ' + ($i) + '=0; ' + ($i) + '<' + ($vSchema) + '.length; ' + ($i) + '++) if (equal(' + ($data) + ', ' + ($vSchema) + '[' + ($i) + '])) { ' + ($valid) + ' = true; break; }';
	  if ($isData) {
	    out += '  }  ';
	  }
	  out += ' if (!' + ($valid) + ') {   ';
	  var $$outStack = $$outStack || [];
	  $$outStack.push(out);
	  out = ''; /* istanbul ignore else */
	  if (it.createErrors !== false) {
	    out += ' { keyword: \'' + ('enum') + '\' , dataPath: (dataPath || \'\') + ' + (it.errorPath) + ' , schemaPath: ' + (it.util.toQuotedString($errSchemaPath)) + ' , params: { allowedValues: schema' + ($lvl) + ' } ';
	    if (it.opts.messages !== false) {
	      out += ' , message: \'should be equal to one of the allowed values\' ';
	    }
	    if (it.opts.verbose) {
	      out += ' , schema: validate.schema' + ($schemaPath) + ' , parentSchema: validate.schema' + (it.schemaPath) + ' , data: ' + ($data) + ' ';
	    }
	    out += ' } ';
	  } else {
	    out += ' {} ';
	  }
	  var __err = out;
	  out = $$outStack.pop();
	  if (!it.compositeRule && $breakOnError) {
	    /* istanbul ignore if */
	    if (it.async) {
	      out += ' throw new ValidationError([' + (__err) + ']); ';
	    } else {
	      out += ' validate.errors = [' + (__err) + ']; return false; ';
	    }
	  } else {
	    out += ' var err = ' + (__err) + ';  if (vErrors === null) vErrors = [err]; else vErrors.push(err); errors++; ';
	  }
	  out += ' }';
	  if ($breakOnError) {
	    out += ' else { ';
	  }
	  return out;
	};
	return _enum;
}

var format;
var hasRequiredFormat;

function requireFormat () {
	if (hasRequiredFormat) return format;
	hasRequiredFormat = 1;
	format = function generate_format(it, $keyword, $ruleType) {
	  var out = ' ';
	  var $lvl = it.level;
	  var $dataLvl = it.dataLevel;
	  var $schema = it.schema[$keyword];
	  var $schemaPath = it.schemaPath + it.util.getProperty($keyword);
	  var $errSchemaPath = it.errSchemaPath + '/' + $keyword;
	  var $breakOnError = !it.opts.allErrors;
	  var $data = 'data' + ($dataLvl || '');
	  if (it.opts.format === false) {
	    if ($breakOnError) {
	      out += ' if (true) { ';
	    }
	    return out;
	  }
	  var $isData = it.opts.$data && $schema && $schema.$data,
	    $schemaValue;
	  if ($isData) {
	    out += ' var schema' + ($lvl) + ' = ' + (it.util.getData($schema.$data, $dataLvl, it.dataPathArr)) + '; ';
	    $schemaValue = 'schema' + $lvl;
	  } else {
	    $schemaValue = $schema;
	  }
	  var $unknownFormats = it.opts.unknownFormats,
	    $allowUnknown = Array.isArray($unknownFormats);
	  if ($isData) {
	    var $format = 'format' + $lvl,
	      $isObject = 'isObject' + $lvl,
	      $formatType = 'formatType' + $lvl;
	    out += ' var ' + ($format) + ' = formats[' + ($schemaValue) + ']; var ' + ($isObject) + ' = typeof ' + ($format) + ' == \'object\' && !(' + ($format) + ' instanceof RegExp) && ' + ($format) + '.validate; var ' + ($formatType) + ' = ' + ($isObject) + ' && ' + ($format) + '.type || \'string\'; if (' + ($isObject) + ') { ';
	    if (it.async) {
	      out += ' var async' + ($lvl) + ' = ' + ($format) + '.async; ';
	    }
	    out += ' ' + ($format) + ' = ' + ($format) + '.validate; } if (  ';
	    if ($isData) {
	      out += ' (' + ($schemaValue) + ' !== undefined && typeof ' + ($schemaValue) + ' != \'string\') || ';
	    }
	    out += ' (';
	    if ($unknownFormats != 'ignore') {
	      out += ' (' + ($schemaValue) + ' && !' + ($format) + ' ';
	      if ($allowUnknown) {
	        out += ' && self._opts.unknownFormats.indexOf(' + ($schemaValue) + ') == -1 ';
	      }
	      out += ') || ';
	    }
	    out += ' (' + ($format) + ' && ' + ($formatType) + ' == \'' + ($ruleType) + '\' && !(typeof ' + ($format) + ' == \'function\' ? ';
	    if (it.async) {
	      out += ' (async' + ($lvl) + ' ? await ' + ($format) + '(' + ($data) + ') : ' + ($format) + '(' + ($data) + ')) ';
	    } else {
	      out += ' ' + ($format) + '(' + ($data) + ') ';
	    }
	    out += ' : ' + ($format) + '.test(' + ($data) + '))))) {';
	  } else {
	    var $format = it.formats[$schema];
	    if (!$format) {
	      if ($unknownFormats == 'ignore') {
	        it.logger.warn('unknown format "' + $schema + '" ignored in schema at path "' + it.errSchemaPath + '"');
	        if ($breakOnError) {
	          out += ' if (true) { ';
	        }
	        return out;
	      } else if ($allowUnknown && $unknownFormats.indexOf($schema) >= 0) {
	        if ($breakOnError) {
	          out += ' if (true) { ';
	        }
	        return out;
	      } else {
	        throw new Error('unknown format "' + $schema + '" is used in schema at path "' + it.errSchemaPath + '"');
	      }
	    }
	    var $isObject = typeof $format == 'object' && !($format instanceof RegExp) && $format.validate;
	    var $formatType = $isObject && $format.type || 'string';
	    if ($isObject) {
	      var $async = $format.async === true;
	      $format = $format.validate;
	    }
	    if ($formatType != $ruleType) {
	      if ($breakOnError) {
	        out += ' if (true) { ';
	      }
	      return out;
	    }
	    if ($async) {
	      if (!it.async) throw new Error('async format in sync schema');
	      var $formatRef = 'formats' + it.util.getProperty($schema) + '.validate';
	      out += ' if (!(await ' + ($formatRef) + '(' + ($data) + '))) { ';
	    } else {
	      out += ' if (! ';
	      var $formatRef = 'formats' + it.util.getProperty($schema);
	      if ($isObject) $formatRef += '.validate';
	      if (typeof $format == 'function') {
	        out += ' ' + ($formatRef) + '(' + ($data) + ') ';
	      } else {
	        out += ' ' + ($formatRef) + '.test(' + ($data) + ') ';
	      }
	      out += ') { ';
	    }
	  }
	  var $$outStack = $$outStack || [];
	  $$outStack.push(out);
	  out = ''; /* istanbul ignore else */
	  if (it.createErrors !== false) {
	    out += ' { keyword: \'' + ('format') + '\' , dataPath: (dataPath || \'\') + ' + (it.errorPath) + ' , schemaPath: ' + (it.util.toQuotedString($errSchemaPath)) + ' , params: { format:  ';
	    if ($isData) {
	      out += '' + ($schemaValue);
	    } else {
	      out += '' + (it.util.toQuotedString($schema));
	    }
	    out += '  } ';
	    if (it.opts.messages !== false) {
	      out += ' , message: \'should match format "';
	      if ($isData) {
	        out += '\' + ' + ($schemaValue) + ' + \'';
	      } else {
	        out += '' + (it.util.escapeQuotes($schema));
	      }
	      out += '"\' ';
	    }
	    if (it.opts.verbose) {
	      out += ' , schema:  ';
	      if ($isData) {
	        out += 'validate.schema' + ($schemaPath);
	      } else {
	        out += '' + (it.util.toQuotedString($schema));
	      }
	      out += '         , parentSchema: validate.schema' + (it.schemaPath) + ' , data: ' + ($data) + ' ';
	    }
	    out += ' } ';
	  } else {
	    out += ' {} ';
	  }
	  var __err = out;
	  out = $$outStack.pop();
	  if (!it.compositeRule && $breakOnError) {
	    /* istanbul ignore if */
	    if (it.async) {
	      out += ' throw new ValidationError([' + (__err) + ']); ';
	    } else {
	      out += ' validate.errors = [' + (__err) + ']; return false; ';
	    }
	  } else {
	    out += ' var err = ' + (__err) + ';  if (vErrors === null) vErrors = [err]; else vErrors.push(err); errors++; ';
	  }
	  out += ' } ';
	  if ($breakOnError) {
	    out += ' else { ';
	  }
	  return out;
	};
	return format;
}

var _if;
var hasRequired_if;

function require_if () {
	if (hasRequired_if) return _if;
	hasRequired_if = 1;
	_if = function generate_if(it, $keyword, $ruleType) {
	  var out = ' ';
	  var $lvl = it.level;
	  var $dataLvl = it.dataLevel;
	  var $schema = it.schema[$keyword];
	  var $schemaPath = it.schemaPath + it.util.getProperty($keyword);
	  var $errSchemaPath = it.errSchemaPath + '/' + $keyword;
	  var $breakOnError = !it.opts.allErrors;
	  var $data = 'data' + ($dataLvl || '');
	  var $valid = 'valid' + $lvl;
	  var $errs = 'errs__' + $lvl;
	  var $it = it.util.copy(it);
	  $it.level++;
	  var $nextValid = 'valid' + $it.level;
	  var $thenSch = it.schema['then'],
	    $elseSch = it.schema['else'],
	    $thenPresent = $thenSch !== undefined && (it.opts.strictKeywords ? (typeof $thenSch == 'object' && Object.keys($thenSch).length > 0) || $thenSch === false : it.util.schemaHasRules($thenSch, it.RULES.all)),
	    $elsePresent = $elseSch !== undefined && (it.opts.strictKeywords ? (typeof $elseSch == 'object' && Object.keys($elseSch).length > 0) || $elseSch === false : it.util.schemaHasRules($elseSch, it.RULES.all)),
	    $currentBaseId = $it.baseId;
	  if ($thenPresent || $elsePresent) {
	    var $ifClause;
	    $it.createErrors = false;
	    $it.schema = $schema;
	    $it.schemaPath = $schemaPath;
	    $it.errSchemaPath = $errSchemaPath;
	    out += ' var ' + ($errs) + ' = errors; var ' + ($valid) + ' = true;  ';
	    var $wasComposite = it.compositeRule;
	    it.compositeRule = $it.compositeRule = true;
	    out += '  ' + (it.validate($it)) + ' ';
	    $it.baseId = $currentBaseId;
	    $it.createErrors = true;
	    out += '  errors = ' + ($errs) + '; if (vErrors !== null) { if (' + ($errs) + ') vErrors.length = ' + ($errs) + '; else vErrors = null; }  ';
	    it.compositeRule = $it.compositeRule = $wasComposite;
	    if ($thenPresent) {
	      out += ' if (' + ($nextValid) + ') {  ';
	      $it.schema = it.schema['then'];
	      $it.schemaPath = it.schemaPath + '.then';
	      $it.errSchemaPath = it.errSchemaPath + '/then';
	      out += '  ' + (it.validate($it)) + ' ';
	      $it.baseId = $currentBaseId;
	      out += ' ' + ($valid) + ' = ' + ($nextValid) + '; ';
	      if ($thenPresent && $elsePresent) {
	        $ifClause = 'ifClause' + $lvl;
	        out += ' var ' + ($ifClause) + ' = \'then\'; ';
	      } else {
	        $ifClause = '\'then\'';
	      }
	      out += ' } ';
	      if ($elsePresent) {
	        out += ' else { ';
	      }
	    } else {
	      out += ' if (!' + ($nextValid) + ') { ';
	    }
	    if ($elsePresent) {
	      $it.schema = it.schema['else'];
	      $it.schemaPath = it.schemaPath + '.else';
	      $it.errSchemaPath = it.errSchemaPath + '/else';
	      out += '  ' + (it.validate($it)) + ' ';
	      $it.baseId = $currentBaseId;
	      out += ' ' + ($valid) + ' = ' + ($nextValid) + '; ';
	      if ($thenPresent && $elsePresent) {
	        $ifClause = 'ifClause' + $lvl;
	        out += ' var ' + ($ifClause) + ' = \'else\'; ';
	      } else {
	        $ifClause = '\'else\'';
	      }
	      out += ' } ';
	    }
	    out += ' if (!' + ($valid) + ') {   var err =   '; /* istanbul ignore else */
	    if (it.createErrors !== false) {
	      out += ' { keyword: \'' + ('if') + '\' , dataPath: (dataPath || \'\') + ' + (it.errorPath) + ' , schemaPath: ' + (it.util.toQuotedString($errSchemaPath)) + ' , params: { failingKeyword: ' + ($ifClause) + ' } ';
	      if (it.opts.messages !== false) {
	        out += ' , message: \'should match "\' + ' + ($ifClause) + ' + \'" schema\' ';
	      }
	      if (it.opts.verbose) {
	        out += ' , schema: validate.schema' + ($schemaPath) + ' , parentSchema: validate.schema' + (it.schemaPath) + ' , data: ' + ($data) + ' ';
	      }
	      out += ' } ';
	    } else {
	      out += ' {} ';
	    }
	    out += ';  if (vErrors === null) vErrors = [err]; else vErrors.push(err); errors++; ';
	    if (!it.compositeRule && $breakOnError) {
	      /* istanbul ignore if */
	      if (it.async) {
	        out += ' throw new ValidationError(vErrors); ';
	      } else {
	        out += ' validate.errors = vErrors; return false; ';
	      }
	    }
	    out += ' }   ';
	    if ($breakOnError) {
	      out += ' else { ';
	    }
	  } else {
	    if ($breakOnError) {
	      out += ' if (true) { ';
	    }
	  }
	  return out;
	};
	return _if;
}

var items;
var hasRequiredItems;

function requireItems () {
	if (hasRequiredItems) return items;
	hasRequiredItems = 1;
	items = function generate_items(it, $keyword, $ruleType) {
	  var out = ' ';
	  var $lvl = it.level;
	  var $dataLvl = it.dataLevel;
	  var $schema = it.schema[$keyword];
	  var $schemaPath = it.schemaPath + it.util.getProperty($keyword);
	  var $errSchemaPath = it.errSchemaPath + '/' + $keyword;
	  var $breakOnError = !it.opts.allErrors;
	  var $data = 'data' + ($dataLvl || '');
	  var $valid = 'valid' + $lvl;
	  var $errs = 'errs__' + $lvl;
	  var $it = it.util.copy(it);
	  var $closingBraces = '';
	  $it.level++;
	  var $nextValid = 'valid' + $it.level;
	  var $idx = 'i' + $lvl,
	    $dataNxt = $it.dataLevel = it.dataLevel + 1,
	    $nextData = 'data' + $dataNxt,
	    $currentBaseId = it.baseId;
	  out += 'var ' + ($errs) + ' = errors;var ' + ($valid) + ';';
	  if (Array.isArray($schema)) {
	    var $additionalItems = it.schema.additionalItems;
	    if ($additionalItems === false) {
	      out += ' ' + ($valid) + ' = ' + ($data) + '.length <= ' + ($schema.length) + '; ';
	      var $currErrSchemaPath = $errSchemaPath;
	      $errSchemaPath = it.errSchemaPath + '/additionalItems';
	      out += '  if (!' + ($valid) + ') {   ';
	      var $$outStack = $$outStack || [];
	      $$outStack.push(out);
	      out = ''; /* istanbul ignore else */
	      if (it.createErrors !== false) {
	        out += ' { keyword: \'' + ('additionalItems') + '\' , dataPath: (dataPath || \'\') + ' + (it.errorPath) + ' , schemaPath: ' + (it.util.toQuotedString($errSchemaPath)) + ' , params: { limit: ' + ($schema.length) + ' } ';
	        if (it.opts.messages !== false) {
	          out += ' , message: \'should NOT have more than ' + ($schema.length) + ' items\' ';
	        }
	        if (it.opts.verbose) {
	          out += ' , schema: false , parentSchema: validate.schema' + (it.schemaPath) + ' , data: ' + ($data) + ' ';
	        }
	        out += ' } ';
	      } else {
	        out += ' {} ';
	      }
	      var __err = out;
	      out = $$outStack.pop();
	      if (!it.compositeRule && $breakOnError) {
	        /* istanbul ignore if */
	        if (it.async) {
	          out += ' throw new ValidationError([' + (__err) + ']); ';
	        } else {
	          out += ' validate.errors = [' + (__err) + ']; return false; ';
	        }
	      } else {
	        out += ' var err = ' + (__err) + ';  if (vErrors === null) vErrors = [err]; else vErrors.push(err); errors++; ';
	      }
	      out += ' } ';
	      $errSchemaPath = $currErrSchemaPath;
	      if ($breakOnError) {
	        $closingBraces += '}';
	        out += ' else { ';
	      }
	    }
	    var arr1 = $schema;
	    if (arr1) {
	      var $sch, $i = -1,
	        l1 = arr1.length - 1;
	      while ($i < l1) {
	        $sch = arr1[$i += 1];
	        if ((it.opts.strictKeywords ? (typeof $sch == 'object' && Object.keys($sch).length > 0) || $sch === false : it.util.schemaHasRules($sch, it.RULES.all))) {
	          out += ' ' + ($nextValid) + ' = true; if (' + ($data) + '.length > ' + ($i) + ') { ';
	          var $passData = $data + '[' + $i + ']';
	          $it.schema = $sch;
	          $it.schemaPath = $schemaPath + '[' + $i + ']';
	          $it.errSchemaPath = $errSchemaPath + '/' + $i;
	          $it.errorPath = it.util.getPathExpr(it.errorPath, $i, it.opts.jsonPointers, true);
	          $it.dataPathArr[$dataNxt] = $i;
	          var $code = it.validate($it);
	          $it.baseId = $currentBaseId;
	          if (it.util.varOccurences($code, $nextData) < 2) {
	            out += ' ' + (it.util.varReplace($code, $nextData, $passData)) + ' ';
	          } else {
	            out += ' var ' + ($nextData) + ' = ' + ($passData) + '; ' + ($code) + ' ';
	          }
	          out += ' }  ';
	          if ($breakOnError) {
	            out += ' if (' + ($nextValid) + ') { ';
	            $closingBraces += '}';
	          }
	        }
	      }
	    }
	    if (typeof $additionalItems == 'object' && (it.opts.strictKeywords ? (typeof $additionalItems == 'object' && Object.keys($additionalItems).length > 0) || $additionalItems === false : it.util.schemaHasRules($additionalItems, it.RULES.all))) {
	      $it.schema = $additionalItems;
	      $it.schemaPath = it.schemaPath + '.additionalItems';
	      $it.errSchemaPath = it.errSchemaPath + '/additionalItems';
	      out += ' ' + ($nextValid) + ' = true; if (' + ($data) + '.length > ' + ($schema.length) + ') {  for (var ' + ($idx) + ' = ' + ($schema.length) + '; ' + ($idx) + ' < ' + ($data) + '.length; ' + ($idx) + '++) { ';
	      $it.errorPath = it.util.getPathExpr(it.errorPath, $idx, it.opts.jsonPointers, true);
	      var $passData = $data + '[' + $idx + ']';
	      $it.dataPathArr[$dataNxt] = $idx;
	      var $code = it.validate($it);
	      $it.baseId = $currentBaseId;
	      if (it.util.varOccurences($code, $nextData) < 2) {
	        out += ' ' + (it.util.varReplace($code, $nextData, $passData)) + ' ';
	      } else {
	        out += ' var ' + ($nextData) + ' = ' + ($passData) + '; ' + ($code) + ' ';
	      }
	      if ($breakOnError) {
	        out += ' if (!' + ($nextValid) + ') break; ';
	      }
	      out += ' } }  ';
	      if ($breakOnError) {
	        out += ' if (' + ($nextValid) + ') { ';
	        $closingBraces += '}';
	      }
	    }
	  } else if ((it.opts.strictKeywords ? (typeof $schema == 'object' && Object.keys($schema).length > 0) || $schema === false : it.util.schemaHasRules($schema, it.RULES.all))) {
	    $it.schema = $schema;
	    $it.schemaPath = $schemaPath;
	    $it.errSchemaPath = $errSchemaPath;
	    out += '  for (var ' + ($idx) + ' = ' + (0) + '; ' + ($idx) + ' < ' + ($data) + '.length; ' + ($idx) + '++) { ';
	    $it.errorPath = it.util.getPathExpr(it.errorPath, $idx, it.opts.jsonPointers, true);
	    var $passData = $data + '[' + $idx + ']';
	    $it.dataPathArr[$dataNxt] = $idx;
	    var $code = it.validate($it);
	    $it.baseId = $currentBaseId;
	    if (it.util.varOccurences($code, $nextData) < 2) {
	      out += ' ' + (it.util.varReplace($code, $nextData, $passData)) + ' ';
	    } else {
	      out += ' var ' + ($nextData) + ' = ' + ($passData) + '; ' + ($code) + ' ';
	    }
	    if ($breakOnError) {
	      out += ' if (!' + ($nextValid) + ') break; ';
	    }
	    out += ' }';
	  }
	  if ($breakOnError) {
	    out += ' ' + ($closingBraces) + ' if (' + ($errs) + ' == errors) {';
	  }
	  return out;
	};
	return items;
}

var _limit;
var hasRequired_limit;

function require_limit () {
	if (hasRequired_limit) return _limit;
	hasRequired_limit = 1;
	_limit = function generate__limit(it, $keyword, $ruleType) {
	  var out = ' ';
	  var $lvl = it.level;
	  var $dataLvl = it.dataLevel;
	  var $schema = it.schema[$keyword];
	  var $schemaPath = it.schemaPath + it.util.getProperty($keyword);
	  var $errSchemaPath = it.errSchemaPath + '/' + $keyword;
	  var $breakOnError = !it.opts.allErrors;
	  var $errorKeyword;
	  var $data = 'data' + ($dataLvl || '');
	  var $isData = it.opts.$data && $schema && $schema.$data,
	    $schemaValue;
	  if ($isData) {
	    out += ' var schema' + ($lvl) + ' = ' + (it.util.getData($schema.$data, $dataLvl, it.dataPathArr)) + '; ';
	    $schemaValue = 'schema' + $lvl;
	  } else {
	    $schemaValue = $schema;
	  }
	  var $isMax = $keyword == 'maximum',
	    $exclusiveKeyword = $isMax ? 'exclusiveMaximum' : 'exclusiveMinimum',
	    $schemaExcl = it.schema[$exclusiveKeyword],
	    $isDataExcl = it.opts.$data && $schemaExcl && $schemaExcl.$data,
	    $op = $isMax ? '<' : '>',
	    $notOp = $isMax ? '>' : '<',
	    $errorKeyword = undefined;
	  if (!($isData || typeof $schema == 'number' || $schema === undefined)) {
	    throw new Error($keyword + ' must be number');
	  }
	  if (!($isDataExcl || $schemaExcl === undefined || typeof $schemaExcl == 'number' || typeof $schemaExcl == 'boolean')) {
	    throw new Error($exclusiveKeyword + ' must be number or boolean');
	  }
	  if ($isDataExcl) {
	    var $schemaValueExcl = it.util.getData($schemaExcl.$data, $dataLvl, it.dataPathArr),
	      $exclusive = 'exclusive' + $lvl,
	      $exclType = 'exclType' + $lvl,
	      $exclIsNumber = 'exclIsNumber' + $lvl,
	      $opExpr = 'op' + $lvl,
	      $opStr = '\' + ' + $opExpr + ' + \'';
	    out += ' var schemaExcl' + ($lvl) + ' = ' + ($schemaValueExcl) + '; ';
	    $schemaValueExcl = 'schemaExcl' + $lvl;
	    out += ' var ' + ($exclusive) + '; var ' + ($exclType) + ' = typeof ' + ($schemaValueExcl) + '; if (' + ($exclType) + ' != \'boolean\' && ' + ($exclType) + ' != \'undefined\' && ' + ($exclType) + ' != \'number\') { ';
	    var $errorKeyword = $exclusiveKeyword;
	    var $$outStack = $$outStack || [];
	    $$outStack.push(out);
	    out = ''; /* istanbul ignore else */
	    if (it.createErrors !== false) {
	      out += ' { keyword: \'' + ($errorKeyword || '_exclusiveLimit') + '\' , dataPath: (dataPath || \'\') + ' + (it.errorPath) + ' , schemaPath: ' + (it.util.toQuotedString($errSchemaPath)) + ' , params: {} ';
	      if (it.opts.messages !== false) {
	        out += ' , message: \'' + ($exclusiveKeyword) + ' should be boolean\' ';
	      }
	      if (it.opts.verbose) {
	        out += ' , schema: validate.schema' + ($schemaPath) + ' , parentSchema: validate.schema' + (it.schemaPath) + ' , data: ' + ($data) + ' ';
	      }
	      out += ' } ';
	    } else {
	      out += ' {} ';
	    }
	    var __err = out;
	    out = $$outStack.pop();
	    if (!it.compositeRule && $breakOnError) {
	      /* istanbul ignore if */
	      if (it.async) {
	        out += ' throw new ValidationError([' + (__err) + ']); ';
	      } else {
	        out += ' validate.errors = [' + (__err) + ']; return false; ';
	      }
	    } else {
	      out += ' var err = ' + (__err) + ';  if (vErrors === null) vErrors = [err]; else vErrors.push(err); errors++; ';
	    }
	    out += ' } else if ( ';
	    if ($isData) {
	      out += ' (' + ($schemaValue) + ' !== undefined && typeof ' + ($schemaValue) + ' != \'number\') || ';
	    }
	    out += ' ' + ($exclType) + ' == \'number\' ? ( (' + ($exclusive) + ' = ' + ($schemaValue) + ' === undefined || ' + ($schemaValueExcl) + ' ' + ($op) + '= ' + ($schemaValue) + ') ? ' + ($data) + ' ' + ($notOp) + '= ' + ($schemaValueExcl) + ' : ' + ($data) + ' ' + ($notOp) + ' ' + ($schemaValue) + ' ) : ( (' + ($exclusive) + ' = ' + ($schemaValueExcl) + ' === true) ? ' + ($data) + ' ' + ($notOp) + '= ' + ($schemaValue) + ' : ' + ($data) + ' ' + ($notOp) + ' ' + ($schemaValue) + ' ) || ' + ($data) + ' !== ' + ($data) + ') { var op' + ($lvl) + ' = ' + ($exclusive) + ' ? \'' + ($op) + '\' : \'' + ($op) + '=\'; ';
	    if ($schema === undefined) {
	      $errorKeyword = $exclusiveKeyword;
	      $errSchemaPath = it.errSchemaPath + '/' + $exclusiveKeyword;
	      $schemaValue = $schemaValueExcl;
	      $isData = $isDataExcl;
	    }
	  } else {
	    var $exclIsNumber = typeof $schemaExcl == 'number',
	      $opStr = $op;
	    if ($exclIsNumber && $isData) {
	      var $opExpr = '\'' + $opStr + '\'';
	      out += ' if ( ';
	      if ($isData) {
	        out += ' (' + ($schemaValue) + ' !== undefined && typeof ' + ($schemaValue) + ' != \'number\') || ';
	      }
	      out += ' ( ' + ($schemaValue) + ' === undefined || ' + ($schemaExcl) + ' ' + ($op) + '= ' + ($schemaValue) + ' ? ' + ($data) + ' ' + ($notOp) + '= ' + ($schemaExcl) + ' : ' + ($data) + ' ' + ($notOp) + ' ' + ($schemaValue) + ' ) || ' + ($data) + ' !== ' + ($data) + ') { ';
	    } else {
	      if ($exclIsNumber && $schema === undefined) {
	        $exclusive = true;
	        $errorKeyword = $exclusiveKeyword;
	        $errSchemaPath = it.errSchemaPath + '/' + $exclusiveKeyword;
	        $schemaValue = $schemaExcl;
	        $notOp += '=';
	      } else {
	        if ($exclIsNumber) $schemaValue = Math[$isMax ? 'min' : 'max']($schemaExcl, $schema);
	        if ($schemaExcl === ($exclIsNumber ? $schemaValue : true)) {
	          $exclusive = true;
	          $errorKeyword = $exclusiveKeyword;
	          $errSchemaPath = it.errSchemaPath + '/' + $exclusiveKeyword;
	          $notOp += '=';
	        } else {
	          $exclusive = false;
	          $opStr += '=';
	        }
	      }
	      var $opExpr = '\'' + $opStr + '\'';
	      out += ' if ( ';
	      if ($isData) {
	        out += ' (' + ($schemaValue) + ' !== undefined && typeof ' + ($schemaValue) + ' != \'number\') || ';
	      }
	      out += ' ' + ($data) + ' ' + ($notOp) + ' ' + ($schemaValue) + ' || ' + ($data) + ' !== ' + ($data) + ') { ';
	    }
	  }
	  $errorKeyword = $errorKeyword || $keyword;
	  var $$outStack = $$outStack || [];
	  $$outStack.push(out);
	  out = ''; /* istanbul ignore else */
	  if (it.createErrors !== false) {
	    out += ' { keyword: \'' + ($errorKeyword || '_limit') + '\' , dataPath: (dataPath || \'\') + ' + (it.errorPath) + ' , schemaPath: ' + (it.util.toQuotedString($errSchemaPath)) + ' , params: { comparison: ' + ($opExpr) + ', limit: ' + ($schemaValue) + ', exclusive: ' + ($exclusive) + ' } ';
	    if (it.opts.messages !== false) {
	      out += ' , message: \'should be ' + ($opStr) + ' ';
	      if ($isData) {
	        out += '\' + ' + ($schemaValue);
	      } else {
	        out += '' + ($schemaValue) + '\'';
	      }
	    }
	    if (it.opts.verbose) {
	      out += ' , schema:  ';
	      if ($isData) {
	        out += 'validate.schema' + ($schemaPath);
	      } else {
	        out += '' + ($schema);
	      }
	      out += '         , parentSchema: validate.schema' + (it.schemaPath) + ' , data: ' + ($data) + ' ';
	    }
	    out += ' } ';
	  } else {
	    out += ' {} ';
	  }
	  var __err = out;
	  out = $$outStack.pop();
	  if (!it.compositeRule && $breakOnError) {
	    /* istanbul ignore if */
	    if (it.async) {
	      out += ' throw new ValidationError([' + (__err) + ']); ';
	    } else {
	      out += ' validate.errors = [' + (__err) + ']; return false; ';
	    }
	  } else {
	    out += ' var err = ' + (__err) + ';  if (vErrors === null) vErrors = [err]; else vErrors.push(err); errors++; ';
	  }
	  out += ' } ';
	  if ($breakOnError) {
	    out += ' else { ';
	  }
	  return out;
	};
	return _limit;
}

var _limitItems;
var hasRequired_limitItems;

function require_limitItems () {
	if (hasRequired_limitItems) return _limitItems;
	hasRequired_limitItems = 1;
	_limitItems = function generate__limitItems(it, $keyword, $ruleType) {
	  var out = ' ';
	  var $lvl = it.level;
	  var $dataLvl = it.dataLevel;
	  var $schema = it.schema[$keyword];
	  var $schemaPath = it.schemaPath + it.util.getProperty($keyword);
	  var $errSchemaPath = it.errSchemaPath + '/' + $keyword;
	  var $breakOnError = !it.opts.allErrors;
	  var $errorKeyword;
	  var $data = 'data' + ($dataLvl || '');
	  var $isData = it.opts.$data && $schema && $schema.$data,
	    $schemaValue;
	  if ($isData) {
	    out += ' var schema' + ($lvl) + ' = ' + (it.util.getData($schema.$data, $dataLvl, it.dataPathArr)) + '; ';
	    $schemaValue = 'schema' + $lvl;
	  } else {
	    $schemaValue = $schema;
	  }
	  if (!($isData || typeof $schema == 'number')) {
	    throw new Error($keyword + ' must be number');
	  }
	  var $op = $keyword == 'maxItems' ? '>' : '<';
	  out += 'if ( ';
	  if ($isData) {
	    out += ' (' + ($schemaValue) + ' !== undefined && typeof ' + ($schemaValue) + ' != \'number\') || ';
	  }
	  out += ' ' + ($data) + '.length ' + ($op) + ' ' + ($schemaValue) + ') { ';
	  var $errorKeyword = $keyword;
	  var $$outStack = $$outStack || [];
	  $$outStack.push(out);
	  out = ''; /* istanbul ignore else */
	  if (it.createErrors !== false) {
	    out += ' { keyword: \'' + ($errorKeyword || '_limitItems') + '\' , dataPath: (dataPath || \'\') + ' + (it.errorPath) + ' , schemaPath: ' + (it.util.toQuotedString($errSchemaPath)) + ' , params: { limit: ' + ($schemaValue) + ' } ';
	    if (it.opts.messages !== false) {
	      out += ' , message: \'should NOT have ';
	      if ($keyword == 'maxItems') {
	        out += 'more';
	      } else {
	        out += 'fewer';
	      }
	      out += ' than ';
	      if ($isData) {
	        out += '\' + ' + ($schemaValue) + ' + \'';
	      } else {
	        out += '' + ($schema);
	      }
	      out += ' items\' ';
	    }
	    if (it.opts.verbose) {
	      out += ' , schema:  ';
	      if ($isData) {
	        out += 'validate.schema' + ($schemaPath);
	      } else {
	        out += '' + ($schema);
	      }
	      out += '         , parentSchema: validate.schema' + (it.schemaPath) + ' , data: ' + ($data) + ' ';
	    }
	    out += ' } ';
	  } else {
	    out += ' {} ';
	  }
	  var __err = out;
	  out = $$outStack.pop();
	  if (!it.compositeRule && $breakOnError) {
	    /* istanbul ignore if */
	    if (it.async) {
	      out += ' throw new ValidationError([' + (__err) + ']); ';
	    } else {
	      out += ' validate.errors = [' + (__err) + ']; return false; ';
	    }
	  } else {
	    out += ' var err = ' + (__err) + ';  if (vErrors === null) vErrors = [err]; else vErrors.push(err); errors++; ';
	  }
	  out += '} ';
	  if ($breakOnError) {
	    out += ' else { ';
	  }
	  return out;
	};
	return _limitItems;
}

var _limitLength;
var hasRequired_limitLength;

function require_limitLength () {
	if (hasRequired_limitLength) return _limitLength;
	hasRequired_limitLength = 1;
	_limitLength = function generate__limitLength(it, $keyword, $ruleType) {
	  var out = ' ';
	  var $lvl = it.level;
	  var $dataLvl = it.dataLevel;
	  var $schema = it.schema[$keyword];
	  var $schemaPath = it.schemaPath + it.util.getProperty($keyword);
	  var $errSchemaPath = it.errSchemaPath + '/' + $keyword;
	  var $breakOnError = !it.opts.allErrors;
	  var $errorKeyword;
	  var $data = 'data' + ($dataLvl || '');
	  var $isData = it.opts.$data && $schema && $schema.$data,
	    $schemaValue;
	  if ($isData) {
	    out += ' var schema' + ($lvl) + ' = ' + (it.util.getData($schema.$data, $dataLvl, it.dataPathArr)) + '; ';
	    $schemaValue = 'schema' + $lvl;
	  } else {
	    $schemaValue = $schema;
	  }
	  if (!($isData || typeof $schema == 'number')) {
	    throw new Error($keyword + ' must be number');
	  }
	  var $op = $keyword == 'maxLength' ? '>' : '<';
	  out += 'if ( ';
	  if ($isData) {
	    out += ' (' + ($schemaValue) + ' !== undefined && typeof ' + ($schemaValue) + ' != \'number\') || ';
	  }
	  if (it.opts.unicode === false) {
	    out += ' ' + ($data) + '.length ';
	  } else {
	    out += ' ucs2length(' + ($data) + ') ';
	  }
	  out += ' ' + ($op) + ' ' + ($schemaValue) + ') { ';
	  var $errorKeyword = $keyword;
	  var $$outStack = $$outStack || [];
	  $$outStack.push(out);
	  out = ''; /* istanbul ignore else */
	  if (it.createErrors !== false) {
	    out += ' { keyword: \'' + ($errorKeyword || '_limitLength') + '\' , dataPath: (dataPath || \'\') + ' + (it.errorPath) + ' , schemaPath: ' + (it.util.toQuotedString($errSchemaPath)) + ' , params: { limit: ' + ($schemaValue) + ' } ';
	    if (it.opts.messages !== false) {
	      out += ' , message: \'should NOT be ';
	      if ($keyword == 'maxLength') {
	        out += 'longer';
	      } else {
	        out += 'shorter';
	      }
	      out += ' than ';
	      if ($isData) {
	        out += '\' + ' + ($schemaValue) + ' + \'';
	      } else {
	        out += '' + ($schema);
	      }
	      out += ' characters\' ';
	    }
	    if (it.opts.verbose) {
	      out += ' , schema:  ';
	      if ($isData) {
	        out += 'validate.schema' + ($schemaPath);
	      } else {
	        out += '' + ($schema);
	      }
	      out += '         , parentSchema: validate.schema' + (it.schemaPath) + ' , data: ' + ($data) + ' ';
	    }
	    out += ' } ';
	  } else {
	    out += ' {} ';
	  }
	  var __err = out;
	  out = $$outStack.pop();
	  if (!it.compositeRule && $breakOnError) {
	    /* istanbul ignore if */
	    if (it.async) {
	      out += ' throw new ValidationError([' + (__err) + ']); ';
	    } else {
	      out += ' validate.errors = [' + (__err) + ']; return false; ';
	    }
	  } else {
	    out += ' var err = ' + (__err) + ';  if (vErrors === null) vErrors = [err]; else vErrors.push(err); errors++; ';
	  }
	  out += '} ';
	  if ($breakOnError) {
	    out += ' else { ';
	  }
	  return out;
	};
	return _limitLength;
}

var _limitProperties;
var hasRequired_limitProperties;

function require_limitProperties () {
	if (hasRequired_limitProperties) return _limitProperties;
	hasRequired_limitProperties = 1;
	_limitProperties = function generate__limitProperties(it, $keyword, $ruleType) {
	  var out = ' ';
	  var $lvl = it.level;
	  var $dataLvl = it.dataLevel;
	  var $schema = it.schema[$keyword];
	  var $schemaPath = it.schemaPath + it.util.getProperty($keyword);
	  var $errSchemaPath = it.errSchemaPath + '/' + $keyword;
	  var $breakOnError = !it.opts.allErrors;
	  var $errorKeyword;
	  var $data = 'data' + ($dataLvl || '');
	  var $isData = it.opts.$data && $schema && $schema.$data,
	    $schemaValue;
	  if ($isData) {
	    out += ' var schema' + ($lvl) + ' = ' + (it.util.getData($schema.$data, $dataLvl, it.dataPathArr)) + '; ';
	    $schemaValue = 'schema' + $lvl;
	  } else {
	    $schemaValue = $schema;
	  }
	  if (!($isData || typeof $schema == 'number')) {
	    throw new Error($keyword + ' must be number');
	  }
	  var $op = $keyword == 'maxProperties' ? '>' : '<';
	  out += 'if ( ';
	  if ($isData) {
	    out += ' (' + ($schemaValue) + ' !== undefined && typeof ' + ($schemaValue) + ' != \'number\') || ';
	  }
	  out += ' Object.keys(' + ($data) + ').length ' + ($op) + ' ' + ($schemaValue) + ') { ';
	  var $errorKeyword = $keyword;
	  var $$outStack = $$outStack || [];
	  $$outStack.push(out);
	  out = ''; /* istanbul ignore else */
	  if (it.createErrors !== false) {
	    out += ' { keyword: \'' + ($errorKeyword || '_limitProperties') + '\' , dataPath: (dataPath || \'\') + ' + (it.errorPath) + ' , schemaPath: ' + (it.util.toQuotedString($errSchemaPath)) + ' , params: { limit: ' + ($schemaValue) + ' } ';
	    if (it.opts.messages !== false) {
	      out += ' , message: \'should NOT have ';
	      if ($keyword == 'maxProperties') {
	        out += 'more';
	      } else {
	        out += 'fewer';
	      }
	      out += ' than ';
	      if ($isData) {
	        out += '\' + ' + ($schemaValue) + ' + \'';
	      } else {
	        out += '' + ($schema);
	      }
	      out += ' properties\' ';
	    }
	    if (it.opts.verbose) {
	      out += ' , schema:  ';
	      if ($isData) {
	        out += 'validate.schema' + ($schemaPath);
	      } else {
	        out += '' + ($schema);
	      }
	      out += '         , parentSchema: validate.schema' + (it.schemaPath) + ' , data: ' + ($data) + ' ';
	    }
	    out += ' } ';
	  } else {
	    out += ' {} ';
	  }
	  var __err = out;
	  out = $$outStack.pop();
	  if (!it.compositeRule && $breakOnError) {
	    /* istanbul ignore if */
	    if (it.async) {
	      out += ' throw new ValidationError([' + (__err) + ']); ';
	    } else {
	      out += ' validate.errors = [' + (__err) + ']; return false; ';
	    }
	  } else {
	    out += ' var err = ' + (__err) + ';  if (vErrors === null) vErrors = [err]; else vErrors.push(err); errors++; ';
	  }
	  out += '} ';
	  if ($breakOnError) {
	    out += ' else { ';
	  }
	  return out;
	};
	return _limitProperties;
}

var multipleOf;
var hasRequiredMultipleOf;

function requireMultipleOf () {
	if (hasRequiredMultipleOf) return multipleOf;
	hasRequiredMultipleOf = 1;
	multipleOf = function generate_multipleOf(it, $keyword, $ruleType) {
	  var out = ' ';
	  var $lvl = it.level;
	  var $dataLvl = it.dataLevel;
	  var $schema = it.schema[$keyword];
	  var $schemaPath = it.schemaPath + it.util.getProperty($keyword);
	  var $errSchemaPath = it.errSchemaPath + '/' + $keyword;
	  var $breakOnError = !it.opts.allErrors;
	  var $data = 'data' + ($dataLvl || '');
	  var $isData = it.opts.$data && $schema && $schema.$data,
	    $schemaValue;
	  if ($isData) {
	    out += ' var schema' + ($lvl) + ' = ' + (it.util.getData($schema.$data, $dataLvl, it.dataPathArr)) + '; ';
	    $schemaValue = 'schema' + $lvl;
	  } else {
	    $schemaValue = $schema;
	  }
	  if (!($isData || typeof $schema == 'number')) {
	    throw new Error($keyword + ' must be number');
	  }
	  out += 'var division' + ($lvl) + ';if (';
	  if ($isData) {
	    out += ' ' + ($schemaValue) + ' !== undefined && ( typeof ' + ($schemaValue) + ' != \'number\' || ';
	  }
	  out += ' (division' + ($lvl) + ' = ' + ($data) + ' / ' + ($schemaValue) + ', ';
	  if (it.opts.multipleOfPrecision) {
	    out += ' Math.abs(Math.round(division' + ($lvl) + ') - division' + ($lvl) + ') > 1e-' + (it.opts.multipleOfPrecision) + ' ';
	  } else {
	    out += ' division' + ($lvl) + ' !== parseInt(division' + ($lvl) + ') ';
	  }
	  out += ' ) ';
	  if ($isData) {
	    out += '  )  ';
	  }
	  out += ' ) {   ';
	  var $$outStack = $$outStack || [];
	  $$outStack.push(out);
	  out = ''; /* istanbul ignore else */
	  if (it.createErrors !== false) {
	    out += ' { keyword: \'' + ('multipleOf') + '\' , dataPath: (dataPath || \'\') + ' + (it.errorPath) + ' , schemaPath: ' + (it.util.toQuotedString($errSchemaPath)) + ' , params: { multipleOf: ' + ($schemaValue) + ' } ';
	    if (it.opts.messages !== false) {
	      out += ' , message: \'should be multiple of ';
	      if ($isData) {
	        out += '\' + ' + ($schemaValue);
	      } else {
	        out += '' + ($schemaValue) + '\'';
	      }
	    }
	    if (it.opts.verbose) {
	      out += ' , schema:  ';
	      if ($isData) {
	        out += 'validate.schema' + ($schemaPath);
	      } else {
	        out += '' + ($schema);
	      }
	      out += '         , parentSchema: validate.schema' + (it.schemaPath) + ' , data: ' + ($data) + ' ';
	    }
	    out += ' } ';
	  } else {
	    out += ' {} ';
	  }
	  var __err = out;
	  out = $$outStack.pop();
	  if (!it.compositeRule && $breakOnError) {
	    /* istanbul ignore if */
	    if (it.async) {
	      out += ' throw new ValidationError([' + (__err) + ']); ';
	    } else {
	      out += ' validate.errors = [' + (__err) + ']; return false; ';
	    }
	  } else {
	    out += ' var err = ' + (__err) + ';  if (vErrors === null) vErrors = [err]; else vErrors.push(err); errors++; ';
	  }
	  out += '} ';
	  if ($breakOnError) {
	    out += ' else { ';
	  }
	  return out;
	};
	return multipleOf;
}

var not;
var hasRequiredNot;

function requireNot () {
	if (hasRequiredNot) return not;
	hasRequiredNot = 1;
	not = function generate_not(it, $keyword, $ruleType) {
	  var out = ' ';
	  var $lvl = it.level;
	  var $dataLvl = it.dataLevel;
	  var $schema = it.schema[$keyword];
	  var $schemaPath = it.schemaPath + it.util.getProperty($keyword);
	  var $errSchemaPath = it.errSchemaPath + '/' + $keyword;
	  var $breakOnError = !it.opts.allErrors;
	  var $data = 'data' + ($dataLvl || '');
	  var $errs = 'errs__' + $lvl;
	  var $it = it.util.copy(it);
	  $it.level++;
	  var $nextValid = 'valid' + $it.level;
	  if ((it.opts.strictKeywords ? (typeof $schema == 'object' && Object.keys($schema).length > 0) || $schema === false : it.util.schemaHasRules($schema, it.RULES.all))) {
	    $it.schema = $schema;
	    $it.schemaPath = $schemaPath;
	    $it.errSchemaPath = $errSchemaPath;
	    out += ' var ' + ($errs) + ' = errors;  ';
	    var $wasComposite = it.compositeRule;
	    it.compositeRule = $it.compositeRule = true;
	    $it.createErrors = false;
	    var $allErrorsOption;
	    if ($it.opts.allErrors) {
	      $allErrorsOption = $it.opts.allErrors;
	      $it.opts.allErrors = false;
	    }
	    out += ' ' + (it.validate($it)) + ' ';
	    $it.createErrors = true;
	    if ($allErrorsOption) $it.opts.allErrors = $allErrorsOption;
	    it.compositeRule = $it.compositeRule = $wasComposite;
	    out += ' if (' + ($nextValid) + ') {   ';
	    var $$outStack = $$outStack || [];
	    $$outStack.push(out);
	    out = ''; /* istanbul ignore else */
	    if (it.createErrors !== false) {
	      out += ' { keyword: \'' + ('not') + '\' , dataPath: (dataPath || \'\') + ' + (it.errorPath) + ' , schemaPath: ' + (it.util.toQuotedString($errSchemaPath)) + ' , params: {} ';
	      if (it.opts.messages !== false) {
	        out += ' , message: \'should NOT be valid\' ';
	      }
	      if (it.opts.verbose) {
	        out += ' , schema: validate.schema' + ($schemaPath) + ' , parentSchema: validate.schema' + (it.schemaPath) + ' , data: ' + ($data) + ' ';
	      }
	      out += ' } ';
	    } else {
	      out += ' {} ';
	    }
	    var __err = out;
	    out = $$outStack.pop();
	    if (!it.compositeRule && $breakOnError) {
	      /* istanbul ignore if */
	      if (it.async) {
	        out += ' throw new ValidationError([' + (__err) + ']); ';
	      } else {
	        out += ' validate.errors = [' + (__err) + ']; return false; ';
	      }
	    } else {
	      out += ' var err = ' + (__err) + ';  if (vErrors === null) vErrors = [err]; else vErrors.push(err); errors++; ';
	    }
	    out += ' } else {  errors = ' + ($errs) + '; if (vErrors !== null) { if (' + ($errs) + ') vErrors.length = ' + ($errs) + '; else vErrors = null; } ';
	    if (it.opts.allErrors) {
	      out += ' } ';
	    }
	  } else {
	    out += '  var err =   '; /* istanbul ignore else */
	    if (it.createErrors !== false) {
	      out += ' { keyword: \'' + ('not') + '\' , dataPath: (dataPath || \'\') + ' + (it.errorPath) + ' , schemaPath: ' + (it.util.toQuotedString($errSchemaPath)) + ' , params: {} ';
	      if (it.opts.messages !== false) {
	        out += ' , message: \'should NOT be valid\' ';
	      }
	      if (it.opts.verbose) {
	        out += ' , schema: validate.schema' + ($schemaPath) + ' , parentSchema: validate.schema' + (it.schemaPath) + ' , data: ' + ($data) + ' ';
	      }
	      out += ' } ';
	    } else {
	      out += ' {} ';
	    }
	    out += ';  if (vErrors === null) vErrors = [err]; else vErrors.push(err); errors++; ';
	    if ($breakOnError) {
	      out += ' if (false) { ';
	    }
	  }
	  return out;
	};
	return not;
}

var oneOf;
var hasRequiredOneOf;

function requireOneOf () {
	if (hasRequiredOneOf) return oneOf;
	hasRequiredOneOf = 1;
	oneOf = function generate_oneOf(it, $keyword, $ruleType) {
	  var out = ' ';
	  var $lvl = it.level;
	  var $dataLvl = it.dataLevel;
	  var $schema = it.schema[$keyword];
	  var $schemaPath = it.schemaPath + it.util.getProperty($keyword);
	  var $errSchemaPath = it.errSchemaPath + '/' + $keyword;
	  var $breakOnError = !it.opts.allErrors;
	  var $data = 'data' + ($dataLvl || '');
	  var $valid = 'valid' + $lvl;
	  var $errs = 'errs__' + $lvl;
	  var $it = it.util.copy(it);
	  var $closingBraces = '';
	  $it.level++;
	  var $nextValid = 'valid' + $it.level;
	  var $currentBaseId = $it.baseId,
	    $prevValid = 'prevValid' + $lvl,
	    $passingSchemas = 'passingSchemas' + $lvl;
	  out += 'var ' + ($errs) + ' = errors , ' + ($prevValid) + ' = false , ' + ($valid) + ' = false , ' + ($passingSchemas) + ' = null; ';
	  var $wasComposite = it.compositeRule;
	  it.compositeRule = $it.compositeRule = true;
	  var arr1 = $schema;
	  if (arr1) {
	    var $sch, $i = -1,
	      l1 = arr1.length - 1;
	    while ($i < l1) {
	      $sch = arr1[$i += 1];
	      if ((it.opts.strictKeywords ? (typeof $sch == 'object' && Object.keys($sch).length > 0) || $sch === false : it.util.schemaHasRules($sch, it.RULES.all))) {
	        $it.schema = $sch;
	        $it.schemaPath = $schemaPath + '[' + $i + ']';
	        $it.errSchemaPath = $errSchemaPath + '/' + $i;
	        out += '  ' + (it.validate($it)) + ' ';
	        $it.baseId = $currentBaseId;
	      } else {
	        out += ' var ' + ($nextValid) + ' = true; ';
	      }
	      if ($i) {
	        out += ' if (' + ($nextValid) + ' && ' + ($prevValid) + ') { ' + ($valid) + ' = false; ' + ($passingSchemas) + ' = [' + ($passingSchemas) + ', ' + ($i) + ']; } else { ';
	        $closingBraces += '}';
	      }
	      out += ' if (' + ($nextValid) + ') { ' + ($valid) + ' = ' + ($prevValid) + ' = true; ' + ($passingSchemas) + ' = ' + ($i) + '; }';
	    }
	  }
	  it.compositeRule = $it.compositeRule = $wasComposite;
	  out += '' + ($closingBraces) + 'if (!' + ($valid) + ') {   var err =   '; /* istanbul ignore else */
	  if (it.createErrors !== false) {
	    out += ' { keyword: \'' + ('oneOf') + '\' , dataPath: (dataPath || \'\') + ' + (it.errorPath) + ' , schemaPath: ' + (it.util.toQuotedString($errSchemaPath)) + ' , params: { passingSchemas: ' + ($passingSchemas) + ' } ';
	    if (it.opts.messages !== false) {
	      out += ' , message: \'should match exactly one schema in oneOf\' ';
	    }
	    if (it.opts.verbose) {
	      out += ' , schema: validate.schema' + ($schemaPath) + ' , parentSchema: validate.schema' + (it.schemaPath) + ' , data: ' + ($data) + ' ';
	    }
	    out += ' } ';
	  } else {
	    out += ' {} ';
	  }
	  out += ';  if (vErrors === null) vErrors = [err]; else vErrors.push(err); errors++; ';
	  if (!it.compositeRule && $breakOnError) {
	    /* istanbul ignore if */
	    if (it.async) {
	      out += ' throw new ValidationError(vErrors); ';
	    } else {
	      out += ' validate.errors = vErrors; return false; ';
	    }
	  }
	  out += '} else {  errors = ' + ($errs) + '; if (vErrors !== null) { if (' + ($errs) + ') vErrors.length = ' + ($errs) + '; else vErrors = null; }';
	  if (it.opts.allErrors) {
	    out += ' } ';
	  }
	  return out;
	};
	return oneOf;
}

var pattern;
var hasRequiredPattern;

function requirePattern () {
	if (hasRequiredPattern) return pattern;
	hasRequiredPattern = 1;
	pattern = function generate_pattern(it, $keyword, $ruleType) {
	  var out = ' ';
	  var $lvl = it.level;
	  var $dataLvl = it.dataLevel;
	  var $schema = it.schema[$keyword];
	  var $schemaPath = it.schemaPath + it.util.getProperty($keyword);
	  var $errSchemaPath = it.errSchemaPath + '/' + $keyword;
	  var $breakOnError = !it.opts.allErrors;
	  var $data = 'data' + ($dataLvl || '');
	  var $isData = it.opts.$data && $schema && $schema.$data,
	    $schemaValue;
	  if ($isData) {
	    out += ' var schema' + ($lvl) + ' = ' + (it.util.getData($schema.$data, $dataLvl, it.dataPathArr)) + '; ';
	    $schemaValue = 'schema' + $lvl;
	  } else {
	    $schemaValue = $schema;
	  }
	  var $regexp = $isData ? '(new RegExp(' + $schemaValue + '))' : it.usePattern($schema);
	  out += 'if ( ';
	  if ($isData) {
	    out += ' (' + ($schemaValue) + ' !== undefined && typeof ' + ($schemaValue) + ' != \'string\') || ';
	  }
	  out += ' !' + ($regexp) + '.test(' + ($data) + ') ) {   ';
	  var $$outStack = $$outStack || [];
	  $$outStack.push(out);
	  out = ''; /* istanbul ignore else */
	  if (it.createErrors !== false) {
	    out += ' { keyword: \'' + ('pattern') + '\' , dataPath: (dataPath || \'\') + ' + (it.errorPath) + ' , schemaPath: ' + (it.util.toQuotedString($errSchemaPath)) + ' , params: { pattern:  ';
	    if ($isData) {
	      out += '' + ($schemaValue);
	    } else {
	      out += '' + (it.util.toQuotedString($schema));
	    }
	    out += '  } ';
	    if (it.opts.messages !== false) {
	      out += ' , message: \'should match pattern "';
	      if ($isData) {
	        out += '\' + ' + ($schemaValue) + ' + \'';
	      } else {
	        out += '' + (it.util.escapeQuotes($schema));
	      }
	      out += '"\' ';
	    }
	    if (it.opts.verbose) {
	      out += ' , schema:  ';
	      if ($isData) {
	        out += 'validate.schema' + ($schemaPath);
	      } else {
	        out += '' + (it.util.toQuotedString($schema));
	      }
	      out += '         , parentSchema: validate.schema' + (it.schemaPath) + ' , data: ' + ($data) + ' ';
	    }
	    out += ' } ';
	  } else {
	    out += ' {} ';
	  }
	  var __err = out;
	  out = $$outStack.pop();
	  if (!it.compositeRule && $breakOnError) {
	    /* istanbul ignore if */
	    if (it.async) {
	      out += ' throw new ValidationError([' + (__err) + ']); ';
	    } else {
	      out += ' validate.errors = [' + (__err) + ']; return false; ';
	    }
	  } else {
	    out += ' var err = ' + (__err) + ';  if (vErrors === null) vErrors = [err]; else vErrors.push(err); errors++; ';
	  }
	  out += '} ';
	  if ($breakOnError) {
	    out += ' else { ';
	  }
	  return out;
	};
	return pattern;
}

var properties$2;
var hasRequiredProperties;

function requireProperties () {
	if (hasRequiredProperties) return properties$2;
	hasRequiredProperties = 1;
	properties$2 = function generate_properties(it, $keyword, $ruleType) {
	  var out = ' ';
	  var $lvl = it.level;
	  var $dataLvl = it.dataLevel;
	  var $schema = it.schema[$keyword];
	  var $schemaPath = it.schemaPath + it.util.getProperty($keyword);
	  var $errSchemaPath = it.errSchemaPath + '/' + $keyword;
	  var $breakOnError = !it.opts.allErrors;
	  var $data = 'data' + ($dataLvl || '');
	  var $errs = 'errs__' + $lvl;
	  var $it = it.util.copy(it);
	  var $closingBraces = '';
	  $it.level++;
	  var $nextValid = 'valid' + $it.level;
	  var $key = 'key' + $lvl,
	    $idx = 'idx' + $lvl,
	    $dataNxt = $it.dataLevel = it.dataLevel + 1,
	    $nextData = 'data' + $dataNxt,
	    $dataProperties = 'dataProperties' + $lvl;
	  var $schemaKeys = Object.keys($schema || {}).filter(notProto),
	    $pProperties = it.schema.patternProperties || {},
	    $pPropertyKeys = Object.keys($pProperties).filter(notProto),
	    $aProperties = it.schema.additionalProperties,
	    $someProperties = $schemaKeys.length || $pPropertyKeys.length,
	    $noAdditional = $aProperties === false,
	    $additionalIsSchema = typeof $aProperties == 'object' && Object.keys($aProperties).length,
	    $removeAdditional = it.opts.removeAdditional,
	    $checkAdditional = $noAdditional || $additionalIsSchema || $removeAdditional,
	    $ownProperties = it.opts.ownProperties,
	    $currentBaseId = it.baseId;
	  var $required = it.schema.required;
	  if ($required && !(it.opts.$data && $required.$data) && $required.length < it.opts.loopRequired) {
	    var $requiredHash = it.util.toHash($required);
	  }

	  function notProto(p) {
	    return p !== '__proto__';
	  }
	  out += 'var ' + ($errs) + ' = errors;var ' + ($nextValid) + ' = true;';
	  if ($ownProperties) {
	    out += ' var ' + ($dataProperties) + ' = undefined;';
	  }
	  if ($checkAdditional) {
	    if ($ownProperties) {
	      out += ' ' + ($dataProperties) + ' = ' + ($dataProperties) + ' || Object.keys(' + ($data) + '); for (var ' + ($idx) + '=0; ' + ($idx) + '<' + ($dataProperties) + '.length; ' + ($idx) + '++) { var ' + ($key) + ' = ' + ($dataProperties) + '[' + ($idx) + ']; ';
	    } else {
	      out += ' for (var ' + ($key) + ' in ' + ($data) + ') { ';
	    }
	    if ($someProperties) {
	      out += ' var isAdditional' + ($lvl) + ' = !(false ';
	      if ($schemaKeys.length) {
	        if ($schemaKeys.length > 8) {
	          out += ' || validate.schema' + ($schemaPath) + '.hasOwnProperty(' + ($key) + ') ';
	        } else {
	          var arr1 = $schemaKeys;
	          if (arr1) {
	            var $propertyKey, i1 = -1,
	              l1 = arr1.length - 1;
	            while (i1 < l1) {
	              $propertyKey = arr1[i1 += 1];
	              out += ' || ' + ($key) + ' == ' + (it.util.toQuotedString($propertyKey)) + ' ';
	            }
	          }
	        }
	      }
	      if ($pPropertyKeys.length) {
	        var arr2 = $pPropertyKeys;
	        if (arr2) {
	          var $pProperty, $i = -1,
	            l2 = arr2.length - 1;
	          while ($i < l2) {
	            $pProperty = arr2[$i += 1];
	            out += ' || ' + (it.usePattern($pProperty)) + '.test(' + ($key) + ') ';
	          }
	        }
	      }
	      out += ' ); if (isAdditional' + ($lvl) + ') { ';
	    }
	    if ($removeAdditional == 'all') {
	      out += ' delete ' + ($data) + '[' + ($key) + ']; ';
	    } else {
	      var $currentErrorPath = it.errorPath;
	      var $additionalProperty = '\' + ' + $key + ' + \'';
	      if (it.opts._errorDataPathProperty) {
	        it.errorPath = it.util.getPathExpr(it.errorPath, $key, it.opts.jsonPointers);
	      }
	      if ($noAdditional) {
	        if ($removeAdditional) {
	          out += ' delete ' + ($data) + '[' + ($key) + ']; ';
	        } else {
	          out += ' ' + ($nextValid) + ' = false; ';
	          var $currErrSchemaPath = $errSchemaPath;
	          $errSchemaPath = it.errSchemaPath + '/additionalProperties';
	          var $$outStack = $$outStack || [];
	          $$outStack.push(out);
	          out = ''; /* istanbul ignore else */
	          if (it.createErrors !== false) {
	            out += ' { keyword: \'' + ('additionalProperties') + '\' , dataPath: (dataPath || \'\') + ' + (it.errorPath) + ' , schemaPath: ' + (it.util.toQuotedString($errSchemaPath)) + ' , params: { additionalProperty: \'' + ($additionalProperty) + '\' } ';
	            if (it.opts.messages !== false) {
	              out += ' , message: \'';
	              if (it.opts._errorDataPathProperty) {
	                out += 'is an invalid additional property';
	              } else {
	                out += 'should NOT have additional properties';
	              }
	              out += '\' ';
	            }
	            if (it.opts.verbose) {
	              out += ' , schema: false , parentSchema: validate.schema' + (it.schemaPath) + ' , data: ' + ($data) + ' ';
	            }
	            out += ' } ';
	          } else {
	            out += ' {} ';
	          }
	          var __err = out;
	          out = $$outStack.pop();
	          if (!it.compositeRule && $breakOnError) {
	            /* istanbul ignore if */
	            if (it.async) {
	              out += ' throw new ValidationError([' + (__err) + ']); ';
	            } else {
	              out += ' validate.errors = [' + (__err) + ']; return false; ';
	            }
	          } else {
	            out += ' var err = ' + (__err) + ';  if (vErrors === null) vErrors = [err]; else vErrors.push(err); errors++; ';
	          }
	          $errSchemaPath = $currErrSchemaPath;
	          if ($breakOnError) {
	            out += ' break; ';
	          }
	        }
	      } else if ($additionalIsSchema) {
	        if ($removeAdditional == 'failing') {
	          out += ' var ' + ($errs) + ' = errors;  ';
	          var $wasComposite = it.compositeRule;
	          it.compositeRule = $it.compositeRule = true;
	          $it.schema = $aProperties;
	          $it.schemaPath = it.schemaPath + '.additionalProperties';
	          $it.errSchemaPath = it.errSchemaPath + '/additionalProperties';
	          $it.errorPath = it.opts._errorDataPathProperty ? it.errorPath : it.util.getPathExpr(it.errorPath, $key, it.opts.jsonPointers);
	          var $passData = $data + '[' + $key + ']';
	          $it.dataPathArr[$dataNxt] = $key;
	          var $code = it.validate($it);
	          $it.baseId = $currentBaseId;
	          if (it.util.varOccurences($code, $nextData) < 2) {
	            out += ' ' + (it.util.varReplace($code, $nextData, $passData)) + ' ';
	          } else {
	            out += ' var ' + ($nextData) + ' = ' + ($passData) + '; ' + ($code) + ' ';
	          }
	          out += ' if (!' + ($nextValid) + ') { errors = ' + ($errs) + '; if (validate.errors !== null) { if (errors) validate.errors.length = errors; else validate.errors = null; } delete ' + ($data) + '[' + ($key) + ']; }  ';
	          it.compositeRule = $it.compositeRule = $wasComposite;
	        } else {
	          $it.schema = $aProperties;
	          $it.schemaPath = it.schemaPath + '.additionalProperties';
	          $it.errSchemaPath = it.errSchemaPath + '/additionalProperties';
	          $it.errorPath = it.opts._errorDataPathProperty ? it.errorPath : it.util.getPathExpr(it.errorPath, $key, it.opts.jsonPointers);
	          var $passData = $data + '[' + $key + ']';
	          $it.dataPathArr[$dataNxt] = $key;
	          var $code = it.validate($it);
	          $it.baseId = $currentBaseId;
	          if (it.util.varOccurences($code, $nextData) < 2) {
	            out += ' ' + (it.util.varReplace($code, $nextData, $passData)) + ' ';
	          } else {
	            out += ' var ' + ($nextData) + ' = ' + ($passData) + '; ' + ($code) + ' ';
	          }
	          if ($breakOnError) {
	            out += ' if (!' + ($nextValid) + ') break; ';
	          }
	        }
	      }
	      it.errorPath = $currentErrorPath;
	    }
	    if ($someProperties) {
	      out += ' } ';
	    }
	    out += ' }  ';
	    if ($breakOnError) {
	      out += ' if (' + ($nextValid) + ') { ';
	      $closingBraces += '}';
	    }
	  }
	  var $useDefaults = it.opts.useDefaults && !it.compositeRule;
	  if ($schemaKeys.length) {
	    var arr3 = $schemaKeys;
	    if (arr3) {
	      var $propertyKey, i3 = -1,
	        l3 = arr3.length - 1;
	      while (i3 < l3) {
	        $propertyKey = arr3[i3 += 1];
	        var $sch = $schema[$propertyKey];
	        if ((it.opts.strictKeywords ? (typeof $sch == 'object' && Object.keys($sch).length > 0) || $sch === false : it.util.schemaHasRules($sch, it.RULES.all))) {
	          var $prop = it.util.getProperty($propertyKey),
	            $passData = $data + $prop,
	            $hasDefault = $useDefaults && $sch.default !== undefined;
	          $it.schema = $sch;
	          $it.schemaPath = $schemaPath + $prop;
	          $it.errSchemaPath = $errSchemaPath + '/' + it.util.escapeFragment($propertyKey);
	          $it.errorPath = it.util.getPath(it.errorPath, $propertyKey, it.opts.jsonPointers);
	          $it.dataPathArr[$dataNxt] = it.util.toQuotedString($propertyKey);
	          var $code = it.validate($it);
	          $it.baseId = $currentBaseId;
	          if (it.util.varOccurences($code, $nextData) < 2) {
	            $code = it.util.varReplace($code, $nextData, $passData);
	            var $useData = $passData;
	          } else {
	            var $useData = $nextData;
	            out += ' var ' + ($nextData) + ' = ' + ($passData) + '; ';
	          }
	          if ($hasDefault) {
	            out += ' ' + ($code) + ' ';
	          } else {
	            if ($requiredHash && $requiredHash[$propertyKey]) {
	              out += ' if ( ' + ($useData) + ' === undefined ';
	              if ($ownProperties) {
	                out += ' || ! Object.prototype.hasOwnProperty.call(' + ($data) + ', \'' + (it.util.escapeQuotes($propertyKey)) + '\') ';
	              }
	              out += ') { ' + ($nextValid) + ' = false; ';
	              var $currentErrorPath = it.errorPath,
	                $currErrSchemaPath = $errSchemaPath,
	                $missingProperty = it.util.escapeQuotes($propertyKey);
	              if (it.opts._errorDataPathProperty) {
	                it.errorPath = it.util.getPath($currentErrorPath, $propertyKey, it.opts.jsonPointers);
	              }
	              $errSchemaPath = it.errSchemaPath + '/required';
	              var $$outStack = $$outStack || [];
	              $$outStack.push(out);
	              out = ''; /* istanbul ignore else */
	              if (it.createErrors !== false) {
	                out += ' { keyword: \'' + ('required') + '\' , dataPath: (dataPath || \'\') + ' + (it.errorPath) + ' , schemaPath: ' + (it.util.toQuotedString($errSchemaPath)) + ' , params: { missingProperty: \'' + ($missingProperty) + '\' } ';
	                if (it.opts.messages !== false) {
	                  out += ' , message: \'';
	                  if (it.opts._errorDataPathProperty) {
	                    out += 'is a required property';
	                  } else {
	                    out += 'should have required property \\\'' + ($missingProperty) + '\\\'';
	                  }
	                  out += '\' ';
	                }
	                if (it.opts.verbose) {
	                  out += ' , schema: validate.schema' + ($schemaPath) + ' , parentSchema: validate.schema' + (it.schemaPath) + ' , data: ' + ($data) + ' ';
	                }
	                out += ' } ';
	              } else {
	                out += ' {} ';
	              }
	              var __err = out;
	              out = $$outStack.pop();
	              if (!it.compositeRule && $breakOnError) {
	                /* istanbul ignore if */
	                if (it.async) {
	                  out += ' throw new ValidationError([' + (__err) + ']); ';
	                } else {
	                  out += ' validate.errors = [' + (__err) + ']; return false; ';
	                }
	              } else {
	                out += ' var err = ' + (__err) + ';  if (vErrors === null) vErrors = [err]; else vErrors.push(err); errors++; ';
	              }
	              $errSchemaPath = $currErrSchemaPath;
	              it.errorPath = $currentErrorPath;
	              out += ' } else { ';
	            } else {
	              if ($breakOnError) {
	                out += ' if ( ' + ($useData) + ' === undefined ';
	                if ($ownProperties) {
	                  out += ' || ! Object.prototype.hasOwnProperty.call(' + ($data) + ', \'' + (it.util.escapeQuotes($propertyKey)) + '\') ';
	                }
	                out += ') { ' + ($nextValid) + ' = true; } else { ';
	              } else {
	                out += ' if (' + ($useData) + ' !== undefined ';
	                if ($ownProperties) {
	                  out += ' &&   Object.prototype.hasOwnProperty.call(' + ($data) + ', \'' + (it.util.escapeQuotes($propertyKey)) + '\') ';
	                }
	                out += ' ) { ';
	              }
	            }
	            out += ' ' + ($code) + ' } ';
	          }
	        }
	        if ($breakOnError) {
	          out += ' if (' + ($nextValid) + ') { ';
	          $closingBraces += '}';
	        }
	      }
	    }
	  }
	  if ($pPropertyKeys.length) {
	    var arr4 = $pPropertyKeys;
	    if (arr4) {
	      var $pProperty, i4 = -1,
	        l4 = arr4.length - 1;
	      while (i4 < l4) {
	        $pProperty = arr4[i4 += 1];
	        var $sch = $pProperties[$pProperty];
	        if ((it.opts.strictKeywords ? (typeof $sch == 'object' && Object.keys($sch).length > 0) || $sch === false : it.util.schemaHasRules($sch, it.RULES.all))) {
	          $it.schema = $sch;
	          $it.schemaPath = it.schemaPath + '.patternProperties' + it.util.getProperty($pProperty);
	          $it.errSchemaPath = it.errSchemaPath + '/patternProperties/' + it.util.escapeFragment($pProperty);
	          if ($ownProperties) {
	            out += ' ' + ($dataProperties) + ' = ' + ($dataProperties) + ' || Object.keys(' + ($data) + '); for (var ' + ($idx) + '=0; ' + ($idx) + '<' + ($dataProperties) + '.length; ' + ($idx) + '++) { var ' + ($key) + ' = ' + ($dataProperties) + '[' + ($idx) + ']; ';
	          } else {
	            out += ' for (var ' + ($key) + ' in ' + ($data) + ') { ';
	          }
	          out += ' if (' + (it.usePattern($pProperty)) + '.test(' + ($key) + ')) { ';
	          $it.errorPath = it.util.getPathExpr(it.errorPath, $key, it.opts.jsonPointers);
	          var $passData = $data + '[' + $key + ']';
	          $it.dataPathArr[$dataNxt] = $key;
	          var $code = it.validate($it);
	          $it.baseId = $currentBaseId;
	          if (it.util.varOccurences($code, $nextData) < 2) {
	            out += ' ' + (it.util.varReplace($code, $nextData, $passData)) + ' ';
	          } else {
	            out += ' var ' + ($nextData) + ' = ' + ($passData) + '; ' + ($code) + ' ';
	          }
	          if ($breakOnError) {
	            out += ' if (!' + ($nextValid) + ') break; ';
	          }
	          out += ' } ';
	          if ($breakOnError) {
	            out += ' else ' + ($nextValid) + ' = true; ';
	          }
	          out += ' }  ';
	          if ($breakOnError) {
	            out += ' if (' + ($nextValid) + ') { ';
	            $closingBraces += '}';
	          }
	        }
	      }
	    }
	  }
	  if ($breakOnError) {
	    out += ' ' + ($closingBraces) + ' if (' + ($errs) + ' == errors) {';
	  }
	  return out;
	};
	return properties$2;
}

var propertyNames;
var hasRequiredPropertyNames;

function requirePropertyNames () {
	if (hasRequiredPropertyNames) return propertyNames;
	hasRequiredPropertyNames = 1;
	propertyNames = function generate_propertyNames(it, $keyword, $ruleType) {
	  var out = ' ';
	  var $lvl = it.level;
	  var $dataLvl = it.dataLevel;
	  var $schema = it.schema[$keyword];
	  var $schemaPath = it.schemaPath + it.util.getProperty($keyword);
	  var $errSchemaPath = it.errSchemaPath + '/' + $keyword;
	  var $breakOnError = !it.opts.allErrors;
	  var $data = 'data' + ($dataLvl || '');
	  var $errs = 'errs__' + $lvl;
	  var $it = it.util.copy(it);
	  var $closingBraces = '';
	  $it.level++;
	  var $nextValid = 'valid' + $it.level;
	  out += 'var ' + ($errs) + ' = errors;';
	  if ((it.opts.strictKeywords ? (typeof $schema == 'object' && Object.keys($schema).length > 0) || $schema === false : it.util.schemaHasRules($schema, it.RULES.all))) {
	    $it.schema = $schema;
	    $it.schemaPath = $schemaPath;
	    $it.errSchemaPath = $errSchemaPath;
	    var $key = 'key' + $lvl,
	      $idx = 'idx' + $lvl,
	      $i = 'i' + $lvl,
	      $invalidName = '\' + ' + $key + ' + \'',
	      $dataNxt = $it.dataLevel = it.dataLevel + 1,
	      $nextData = 'data' + $dataNxt,
	      $dataProperties = 'dataProperties' + $lvl,
	      $ownProperties = it.opts.ownProperties,
	      $currentBaseId = it.baseId;
	    if ($ownProperties) {
	      out += ' var ' + ($dataProperties) + ' = undefined; ';
	    }
	    if ($ownProperties) {
	      out += ' ' + ($dataProperties) + ' = ' + ($dataProperties) + ' || Object.keys(' + ($data) + '); for (var ' + ($idx) + '=0; ' + ($idx) + '<' + ($dataProperties) + '.length; ' + ($idx) + '++) { var ' + ($key) + ' = ' + ($dataProperties) + '[' + ($idx) + ']; ';
	    } else {
	      out += ' for (var ' + ($key) + ' in ' + ($data) + ') { ';
	    }
	    out += ' var startErrs' + ($lvl) + ' = errors; ';
	    var $passData = $key;
	    var $wasComposite = it.compositeRule;
	    it.compositeRule = $it.compositeRule = true;
	    var $code = it.validate($it);
	    $it.baseId = $currentBaseId;
	    if (it.util.varOccurences($code, $nextData) < 2) {
	      out += ' ' + (it.util.varReplace($code, $nextData, $passData)) + ' ';
	    } else {
	      out += ' var ' + ($nextData) + ' = ' + ($passData) + '; ' + ($code) + ' ';
	    }
	    it.compositeRule = $it.compositeRule = $wasComposite;
	    out += ' if (!' + ($nextValid) + ') { for (var ' + ($i) + '=startErrs' + ($lvl) + '; ' + ($i) + '<errors; ' + ($i) + '++) { vErrors[' + ($i) + '].propertyName = ' + ($key) + '; }   var err =   '; /* istanbul ignore else */
	    if (it.createErrors !== false) {
	      out += ' { keyword: \'' + ('propertyNames') + '\' , dataPath: (dataPath || \'\') + ' + (it.errorPath) + ' , schemaPath: ' + (it.util.toQuotedString($errSchemaPath)) + ' , params: { propertyName: \'' + ($invalidName) + '\' } ';
	      if (it.opts.messages !== false) {
	        out += ' , message: \'property name \\\'' + ($invalidName) + '\\\' is invalid\' ';
	      }
	      if (it.opts.verbose) {
	        out += ' , schema: validate.schema' + ($schemaPath) + ' , parentSchema: validate.schema' + (it.schemaPath) + ' , data: ' + ($data) + ' ';
	      }
	      out += ' } ';
	    } else {
	      out += ' {} ';
	    }
	    out += ';  if (vErrors === null) vErrors = [err]; else vErrors.push(err); errors++; ';
	    if (!it.compositeRule && $breakOnError) {
	      /* istanbul ignore if */
	      if (it.async) {
	        out += ' throw new ValidationError(vErrors); ';
	      } else {
	        out += ' validate.errors = vErrors; return false; ';
	      }
	    }
	    if ($breakOnError) {
	      out += ' break; ';
	    }
	    out += ' } }';
	  }
	  if ($breakOnError) {
	    out += ' ' + ($closingBraces) + ' if (' + ($errs) + ' == errors) {';
	  }
	  return out;
	};
	return propertyNames;
}

var required$1;
var hasRequiredRequired;

function requireRequired () {
	if (hasRequiredRequired) return required$1;
	hasRequiredRequired = 1;
	required$1 = function generate_required(it, $keyword, $ruleType) {
	  var out = ' ';
	  var $lvl = it.level;
	  var $dataLvl = it.dataLevel;
	  var $schema = it.schema[$keyword];
	  var $schemaPath = it.schemaPath + it.util.getProperty($keyword);
	  var $errSchemaPath = it.errSchemaPath + '/' + $keyword;
	  var $breakOnError = !it.opts.allErrors;
	  var $data = 'data' + ($dataLvl || '');
	  var $valid = 'valid' + $lvl;
	  var $isData = it.opts.$data && $schema && $schema.$data;
	  if ($isData) {
	    out += ' var schema' + ($lvl) + ' = ' + (it.util.getData($schema.$data, $dataLvl, it.dataPathArr)) + '; ';
	  }
	  var $vSchema = 'schema' + $lvl;
	  if (!$isData) {
	    if ($schema.length < it.opts.loopRequired && it.schema.properties && Object.keys(it.schema.properties).length) {
	      var $required = [];
	      var arr1 = $schema;
	      if (arr1) {
	        var $property, i1 = -1,
	          l1 = arr1.length - 1;
	        while (i1 < l1) {
	          $property = arr1[i1 += 1];
	          var $propertySch = it.schema.properties[$property];
	          if (!($propertySch && (it.opts.strictKeywords ? (typeof $propertySch == 'object' && Object.keys($propertySch).length > 0) || $propertySch === false : it.util.schemaHasRules($propertySch, it.RULES.all)))) {
	            $required[$required.length] = $property;
	          }
	        }
	      }
	    } else {
	      var $required = $schema;
	    }
	  }
	  if ($isData || $required.length) {
	    var $currentErrorPath = it.errorPath,
	      $loopRequired = $isData || $required.length >= it.opts.loopRequired,
	      $ownProperties = it.opts.ownProperties;
	    if ($breakOnError) {
	      out += ' var missing' + ($lvl) + '; ';
	      if ($loopRequired) {
	        if (!$isData) {
	          out += ' var ' + ($vSchema) + ' = validate.schema' + ($schemaPath) + '; ';
	        }
	        var $i = 'i' + $lvl,
	          $propertyPath = 'schema' + $lvl + '[' + $i + ']',
	          $missingProperty = '\' + ' + $propertyPath + ' + \'';
	        if (it.opts._errorDataPathProperty) {
	          it.errorPath = it.util.getPathExpr($currentErrorPath, $propertyPath, it.opts.jsonPointers);
	        }
	        out += ' var ' + ($valid) + ' = true; ';
	        if ($isData) {
	          out += ' if (schema' + ($lvl) + ' === undefined) ' + ($valid) + ' = true; else if (!Array.isArray(schema' + ($lvl) + ')) ' + ($valid) + ' = false; else {';
	        }
	        out += ' for (var ' + ($i) + ' = 0; ' + ($i) + ' < ' + ($vSchema) + '.length; ' + ($i) + '++) { ' + ($valid) + ' = ' + ($data) + '[' + ($vSchema) + '[' + ($i) + ']] !== undefined ';
	        if ($ownProperties) {
	          out += ' &&   Object.prototype.hasOwnProperty.call(' + ($data) + ', ' + ($vSchema) + '[' + ($i) + ']) ';
	        }
	        out += '; if (!' + ($valid) + ') break; } ';
	        if ($isData) {
	          out += '  }  ';
	        }
	        out += '  if (!' + ($valid) + ') {   ';
	        var $$outStack = $$outStack || [];
	        $$outStack.push(out);
	        out = ''; /* istanbul ignore else */
	        if (it.createErrors !== false) {
	          out += ' { keyword: \'' + ('required') + '\' , dataPath: (dataPath || \'\') + ' + (it.errorPath) + ' , schemaPath: ' + (it.util.toQuotedString($errSchemaPath)) + ' , params: { missingProperty: \'' + ($missingProperty) + '\' } ';
	          if (it.opts.messages !== false) {
	            out += ' , message: \'';
	            if (it.opts._errorDataPathProperty) {
	              out += 'is a required property';
	            } else {
	              out += 'should have required property \\\'' + ($missingProperty) + '\\\'';
	            }
	            out += '\' ';
	          }
	          if (it.opts.verbose) {
	            out += ' , schema: validate.schema' + ($schemaPath) + ' , parentSchema: validate.schema' + (it.schemaPath) + ' , data: ' + ($data) + ' ';
	          }
	          out += ' } ';
	        } else {
	          out += ' {} ';
	        }
	        var __err = out;
	        out = $$outStack.pop();
	        if (!it.compositeRule && $breakOnError) {
	          /* istanbul ignore if */
	          if (it.async) {
	            out += ' throw new ValidationError([' + (__err) + ']); ';
	          } else {
	            out += ' validate.errors = [' + (__err) + ']; return false; ';
	          }
	        } else {
	          out += ' var err = ' + (__err) + ';  if (vErrors === null) vErrors = [err]; else vErrors.push(err); errors++; ';
	        }
	        out += ' } else { ';
	      } else {
	        out += ' if ( ';
	        var arr2 = $required;
	        if (arr2) {
	          var $propertyKey, $i = -1,
	            l2 = arr2.length - 1;
	          while ($i < l2) {
	            $propertyKey = arr2[$i += 1];
	            if ($i) {
	              out += ' || ';
	            }
	            var $prop = it.util.getProperty($propertyKey),
	              $useData = $data + $prop;
	            out += ' ( ( ' + ($useData) + ' === undefined ';
	            if ($ownProperties) {
	              out += ' || ! Object.prototype.hasOwnProperty.call(' + ($data) + ', \'' + (it.util.escapeQuotes($propertyKey)) + '\') ';
	            }
	            out += ') && (missing' + ($lvl) + ' = ' + (it.util.toQuotedString(it.opts.jsonPointers ? $propertyKey : $prop)) + ') ) ';
	          }
	        }
	        out += ') {  ';
	        var $propertyPath = 'missing' + $lvl,
	          $missingProperty = '\' + ' + $propertyPath + ' + \'';
	        if (it.opts._errorDataPathProperty) {
	          it.errorPath = it.opts.jsonPointers ? it.util.getPathExpr($currentErrorPath, $propertyPath, true) : $currentErrorPath + ' + ' + $propertyPath;
	        }
	        var $$outStack = $$outStack || [];
	        $$outStack.push(out);
	        out = ''; /* istanbul ignore else */
	        if (it.createErrors !== false) {
	          out += ' { keyword: \'' + ('required') + '\' , dataPath: (dataPath || \'\') + ' + (it.errorPath) + ' , schemaPath: ' + (it.util.toQuotedString($errSchemaPath)) + ' , params: { missingProperty: \'' + ($missingProperty) + '\' } ';
	          if (it.opts.messages !== false) {
	            out += ' , message: \'';
	            if (it.opts._errorDataPathProperty) {
	              out += 'is a required property';
	            } else {
	              out += 'should have required property \\\'' + ($missingProperty) + '\\\'';
	            }
	            out += '\' ';
	          }
	          if (it.opts.verbose) {
	            out += ' , schema: validate.schema' + ($schemaPath) + ' , parentSchema: validate.schema' + (it.schemaPath) + ' , data: ' + ($data) + ' ';
	          }
	          out += ' } ';
	        } else {
	          out += ' {} ';
	        }
	        var __err = out;
	        out = $$outStack.pop();
	        if (!it.compositeRule && $breakOnError) {
	          /* istanbul ignore if */
	          if (it.async) {
	            out += ' throw new ValidationError([' + (__err) + ']); ';
	          } else {
	            out += ' validate.errors = [' + (__err) + ']; return false; ';
	          }
	        } else {
	          out += ' var err = ' + (__err) + ';  if (vErrors === null) vErrors = [err]; else vErrors.push(err); errors++; ';
	        }
	        out += ' } else { ';
	      }
	    } else {
	      if ($loopRequired) {
	        if (!$isData) {
	          out += ' var ' + ($vSchema) + ' = validate.schema' + ($schemaPath) + '; ';
	        }
	        var $i = 'i' + $lvl,
	          $propertyPath = 'schema' + $lvl + '[' + $i + ']',
	          $missingProperty = '\' + ' + $propertyPath + ' + \'';
	        if (it.opts._errorDataPathProperty) {
	          it.errorPath = it.util.getPathExpr($currentErrorPath, $propertyPath, it.opts.jsonPointers);
	        }
	        if ($isData) {
	          out += ' if (' + ($vSchema) + ' && !Array.isArray(' + ($vSchema) + ')) {  var err =   '; /* istanbul ignore else */
	          if (it.createErrors !== false) {
	            out += ' { keyword: \'' + ('required') + '\' , dataPath: (dataPath || \'\') + ' + (it.errorPath) + ' , schemaPath: ' + (it.util.toQuotedString($errSchemaPath)) + ' , params: { missingProperty: \'' + ($missingProperty) + '\' } ';
	            if (it.opts.messages !== false) {
	              out += ' , message: \'';
	              if (it.opts._errorDataPathProperty) {
	                out += 'is a required property';
	              } else {
	                out += 'should have required property \\\'' + ($missingProperty) + '\\\'';
	              }
	              out += '\' ';
	            }
	            if (it.opts.verbose) {
	              out += ' , schema: validate.schema' + ($schemaPath) + ' , parentSchema: validate.schema' + (it.schemaPath) + ' , data: ' + ($data) + ' ';
	            }
	            out += ' } ';
	          } else {
	            out += ' {} ';
	          }
	          out += ';  if (vErrors === null) vErrors = [err]; else vErrors.push(err); errors++; } else if (' + ($vSchema) + ' !== undefined) { ';
	        }
	        out += ' for (var ' + ($i) + ' = 0; ' + ($i) + ' < ' + ($vSchema) + '.length; ' + ($i) + '++) { if (' + ($data) + '[' + ($vSchema) + '[' + ($i) + ']] === undefined ';
	        if ($ownProperties) {
	          out += ' || ! Object.prototype.hasOwnProperty.call(' + ($data) + ', ' + ($vSchema) + '[' + ($i) + ']) ';
	        }
	        out += ') {  var err =   '; /* istanbul ignore else */
	        if (it.createErrors !== false) {
	          out += ' { keyword: \'' + ('required') + '\' , dataPath: (dataPath || \'\') + ' + (it.errorPath) + ' , schemaPath: ' + (it.util.toQuotedString($errSchemaPath)) + ' , params: { missingProperty: \'' + ($missingProperty) + '\' } ';
	          if (it.opts.messages !== false) {
	            out += ' , message: \'';
	            if (it.opts._errorDataPathProperty) {
	              out += 'is a required property';
	            } else {
	              out += 'should have required property \\\'' + ($missingProperty) + '\\\'';
	            }
	            out += '\' ';
	          }
	          if (it.opts.verbose) {
	            out += ' , schema: validate.schema' + ($schemaPath) + ' , parentSchema: validate.schema' + (it.schemaPath) + ' , data: ' + ($data) + ' ';
	          }
	          out += ' } ';
	        } else {
	          out += ' {} ';
	        }
	        out += ';  if (vErrors === null) vErrors = [err]; else vErrors.push(err); errors++; } } ';
	        if ($isData) {
	          out += '  }  ';
	        }
	      } else {
	        var arr3 = $required;
	        if (arr3) {
	          var $propertyKey, i3 = -1,
	            l3 = arr3.length - 1;
	          while (i3 < l3) {
	            $propertyKey = arr3[i3 += 1];
	            var $prop = it.util.getProperty($propertyKey),
	              $missingProperty = it.util.escapeQuotes($propertyKey),
	              $useData = $data + $prop;
	            if (it.opts._errorDataPathProperty) {
	              it.errorPath = it.util.getPath($currentErrorPath, $propertyKey, it.opts.jsonPointers);
	            }
	            out += ' if ( ' + ($useData) + ' === undefined ';
	            if ($ownProperties) {
	              out += ' || ! Object.prototype.hasOwnProperty.call(' + ($data) + ', \'' + (it.util.escapeQuotes($propertyKey)) + '\') ';
	            }
	            out += ') {  var err =   '; /* istanbul ignore else */
	            if (it.createErrors !== false) {
	              out += ' { keyword: \'' + ('required') + '\' , dataPath: (dataPath || \'\') + ' + (it.errorPath) + ' , schemaPath: ' + (it.util.toQuotedString($errSchemaPath)) + ' , params: { missingProperty: \'' + ($missingProperty) + '\' } ';
	              if (it.opts.messages !== false) {
	                out += ' , message: \'';
	                if (it.opts._errorDataPathProperty) {
	                  out += 'is a required property';
	                } else {
	                  out += 'should have required property \\\'' + ($missingProperty) + '\\\'';
	                }
	                out += '\' ';
	              }
	              if (it.opts.verbose) {
	                out += ' , schema: validate.schema' + ($schemaPath) + ' , parentSchema: validate.schema' + (it.schemaPath) + ' , data: ' + ($data) + ' ';
	              }
	              out += ' } ';
	            } else {
	              out += ' {} ';
	            }
	            out += ';  if (vErrors === null) vErrors = [err]; else vErrors.push(err); errors++; } ';
	          }
	        }
	      }
	    }
	    it.errorPath = $currentErrorPath;
	  } else if ($breakOnError) {
	    out += ' if (true) {';
	  }
	  return out;
	};
	return required$1;
}

var uniqueItems;
var hasRequiredUniqueItems;

function requireUniqueItems () {
	if (hasRequiredUniqueItems) return uniqueItems;
	hasRequiredUniqueItems = 1;
	uniqueItems = function generate_uniqueItems(it, $keyword, $ruleType) {
	  var out = ' ';
	  var $lvl = it.level;
	  var $dataLvl = it.dataLevel;
	  var $schema = it.schema[$keyword];
	  var $schemaPath = it.schemaPath + it.util.getProperty($keyword);
	  var $errSchemaPath = it.errSchemaPath + '/' + $keyword;
	  var $breakOnError = !it.opts.allErrors;
	  var $data = 'data' + ($dataLvl || '');
	  var $valid = 'valid' + $lvl;
	  var $isData = it.opts.$data && $schema && $schema.$data,
	    $schemaValue;
	  if ($isData) {
	    out += ' var schema' + ($lvl) + ' = ' + (it.util.getData($schema.$data, $dataLvl, it.dataPathArr)) + '; ';
	    $schemaValue = 'schema' + $lvl;
	  } else {
	    $schemaValue = $schema;
	  }
	  if (($schema || $isData) && it.opts.uniqueItems !== false) {
	    if ($isData) {
	      out += ' var ' + ($valid) + '; if (' + ($schemaValue) + ' === false || ' + ($schemaValue) + ' === undefined) ' + ($valid) + ' = true; else if (typeof ' + ($schemaValue) + ' != \'boolean\') ' + ($valid) + ' = false; else { ';
	    }
	    out += ' var i = ' + ($data) + '.length , ' + ($valid) + ' = true , j; if (i > 1) { ';
	    var $itemType = it.schema.items && it.schema.items.type,
	      $typeIsArray = Array.isArray($itemType);
	    if (!$itemType || $itemType == 'object' || $itemType == 'array' || ($typeIsArray && ($itemType.indexOf('object') >= 0 || $itemType.indexOf('array') >= 0))) {
	      out += ' outer: for (;i--;) { for (j = i; j--;) { if (equal(' + ($data) + '[i], ' + ($data) + '[j])) { ' + ($valid) + ' = false; break outer; } } } ';
	    } else {
	      out += ' var itemIndices = {}, item; for (;i--;) { var item = ' + ($data) + '[i]; ';
	      var $method = 'checkDataType' + ($typeIsArray ? 's' : '');
	      out += ' if (' + (it.util[$method]($itemType, 'item', it.opts.strictNumbers, true)) + ') continue; ';
	      if ($typeIsArray) {
	        out += ' if (typeof item == \'string\') item = \'"\' + item; ';
	      }
	      out += ' if (typeof itemIndices[item] == \'number\') { ' + ($valid) + ' = false; j = itemIndices[item]; break; } itemIndices[item] = i; } ';
	    }
	    out += ' } ';
	    if ($isData) {
	      out += '  }  ';
	    }
	    out += ' if (!' + ($valid) + ') {   ';
	    var $$outStack = $$outStack || [];
	    $$outStack.push(out);
	    out = ''; /* istanbul ignore else */
	    if (it.createErrors !== false) {
	      out += ' { keyword: \'' + ('uniqueItems') + '\' , dataPath: (dataPath || \'\') + ' + (it.errorPath) + ' , schemaPath: ' + (it.util.toQuotedString($errSchemaPath)) + ' , params: { i: i, j: j } ';
	      if (it.opts.messages !== false) {
	        out += ' , message: \'should NOT have duplicate items (items ## \' + j + \' and \' + i + \' are identical)\' ';
	      }
	      if (it.opts.verbose) {
	        out += ' , schema:  ';
	        if ($isData) {
	          out += 'validate.schema' + ($schemaPath);
	        } else {
	          out += '' + ($schema);
	        }
	        out += '         , parentSchema: validate.schema' + (it.schemaPath) + ' , data: ' + ($data) + ' ';
	      }
	      out += ' } ';
	    } else {
	      out += ' {} ';
	    }
	    var __err = out;
	    out = $$outStack.pop();
	    if (!it.compositeRule && $breakOnError) {
	      /* istanbul ignore if */
	      if (it.async) {
	        out += ' throw new ValidationError([' + (__err) + ']); ';
	      } else {
	        out += ' validate.errors = [' + (__err) + ']; return false; ';
	      }
	    } else {
	      out += ' var err = ' + (__err) + ';  if (vErrors === null) vErrors = [err]; else vErrors.push(err); errors++; ';
	    }
	    out += ' } ';
	    if ($breakOnError) {
	      out += ' else { ';
	    }
	  } else {
	    if ($breakOnError) {
	      out += ' if (true) { ';
	    }
	  }
	  return out;
	};
	return uniqueItems;
}

var dotjs;
var hasRequiredDotjs;

function requireDotjs () {
	if (hasRequiredDotjs) return dotjs;
	hasRequiredDotjs = 1;

	//all requires must be explicit because browserify won't work with dynamic requires
	dotjs = {
	  '$ref': requireRef(),
	  allOf: requireAllOf(),
	  anyOf: requireAnyOf(),
	  '$comment': requireComment(),
	  const: require_const(),
	  contains: requireContains(),
	  dependencies: requireDependencies(),
	  'enum': require_enum(),
	  format: requireFormat(),
	  'if': require_if(),
	  items: requireItems(),
	  maximum: require_limit(),
	  minimum: require_limit(),
	  maxItems: require_limitItems(),
	  minItems: require_limitItems(),
	  maxLength: require_limitLength(),
	  minLength: require_limitLength(),
	  maxProperties: require_limitProperties(),
	  minProperties: require_limitProperties(),
	  multipleOf: requireMultipleOf(),
	  not: requireNot(),
	  oneOf: requireOneOf(),
	  pattern: requirePattern(),
	  properties: requireProperties(),
	  propertyNames: requirePropertyNames(),
	  required: requireRequired(),
	  uniqueItems: requireUniqueItems(),
	  validate: requireValidate()
	};
	return dotjs;
}

var rules;
var hasRequiredRules;

function requireRules () {
	if (hasRequiredRules) return rules;
	hasRequiredRules = 1;

	var ruleModules = requireDotjs()
	  , toHash = requireUtil().toHash;

	rules = function rules() {
	  var RULES = [
	    { type: 'number',
	      rules: [ { 'maximum': ['exclusiveMaximum'] },
	               { 'minimum': ['exclusiveMinimum'] }, 'multipleOf', 'format'] },
	    { type: 'string',
	      rules: [ 'maxLength', 'minLength', 'pattern', 'format' ] },
	    { type: 'array',
	      rules: [ 'maxItems', 'minItems', 'items', 'contains', 'uniqueItems' ] },
	    { type: 'object',
	      rules: [ 'maxProperties', 'minProperties', 'required', 'dependencies', 'propertyNames',
	               { 'properties': ['additionalProperties', 'patternProperties'] } ] },
	    { rules: [ '$ref', 'const', 'enum', 'not', 'anyOf', 'oneOf', 'allOf', 'if' ] }
	  ];

	  var ALL = [ 'type', '$comment' ];
	  var KEYWORDS = [
	    '$schema', '$id', 'id', '$data', '$async', 'title',
	    'description', 'default', 'definitions',
	    'examples', 'readOnly', 'writeOnly',
	    'contentMediaType', 'contentEncoding',
	    'additionalItems', 'then', 'else'
	  ];
	  var TYPES = [ 'number', 'integer', 'string', 'array', 'object', 'boolean', 'null' ];
	  RULES.all = toHash(ALL);
	  RULES.types = toHash(TYPES);

	  RULES.forEach(function (group) {
	    group.rules = group.rules.map(function (keyword) {
	      var implKeywords;
	      if (typeof keyword == 'object') {
	        var key = Object.keys(keyword)[0];
	        implKeywords = keyword[key];
	        keyword = key;
	        implKeywords.forEach(function (k) {
	          ALL.push(k);
	          RULES.all[k] = true;
	        });
	      }
	      ALL.push(keyword);
	      var rule = RULES.all[keyword] = {
	        keyword: keyword,
	        code: ruleModules[keyword],
	        implements: implKeywords
	      };
	      return rule;
	    });

	    RULES.all.$comment = {
	      keyword: '$comment',
	      code: ruleModules.$comment
	    };

	    if (group.type) RULES.types[group.type] = group;
	  });

	  RULES.keywords = toHash(ALL.concat(KEYWORDS));
	  RULES.custom = {};

	  return RULES;
	};
	return rules;
}

var data;
var hasRequiredData;

function requireData () {
	if (hasRequiredData) return data;
	hasRequiredData = 1;

	var KEYWORDS = [
	  'multipleOf',
	  'maximum',
	  'exclusiveMaximum',
	  'minimum',
	  'exclusiveMinimum',
	  'maxLength',
	  'minLength',
	  'pattern',
	  'additionalItems',
	  'maxItems',
	  'minItems',
	  'uniqueItems',
	  'maxProperties',
	  'minProperties',
	  'required',
	  'additionalProperties',
	  'enum',
	  'format',
	  'const'
	];

	data = function (metaSchema, keywordsJsonPointers) {
	  for (var i=0; i<keywordsJsonPointers.length; i++) {
	    metaSchema = JSON.parse(JSON.stringify(metaSchema));
	    var segments = keywordsJsonPointers[i].split('/');
	    var keywords = metaSchema;
	    var j;
	    for (j=1; j<segments.length; j++)
	      keywords = keywords[segments[j]];

	    for (j=0; j<KEYWORDS.length; j++) {
	      var key = KEYWORDS[j];
	      var schema = keywords[key];
	      if (schema) {
	        keywords[key] = {
	          anyOf: [
	            schema,
	            { $ref: 'https://raw.githubusercontent.com/ajv-validator/ajv/master/lib/refs/data.json#' }
	          ]
	        };
	      }
	    }
	  }

	  return metaSchema;
	};
	return data;
}

var async;
var hasRequiredAsync;

function requireAsync () {
	if (hasRequiredAsync) return async;
	hasRequiredAsync = 1;

	var MissingRefError = requireError_classes().MissingRef;

	async = compileAsync;


	/**
	 * Creates validating function for passed schema with asynchronous loading of missing schemas.
	 * `loadSchema` option should be a function that accepts schema uri and returns promise that resolves with the schema.
	 * @this  Ajv
	 * @param {Object}   schema schema object
	 * @param {Boolean}  meta optional true to compile meta-schema; this parameter can be skipped
	 * @param {Function} callback an optional node-style callback, it is called with 2 parameters: error (or null) and validating function.
	 * @return {Promise} promise that resolves with a validating function.
	 */
	function compileAsync(schema, meta, callback) {
	  /* eslint no-shadow: 0 */
	  /* global Promise */
	  /* jshint validthis: true */
	  var self = this;
	  if (typeof this._opts.loadSchema != 'function')
	    throw new Error('options.loadSchema should be a function');

	  if (typeof meta == 'function') {
	    callback = meta;
	    meta = undefined;
	  }

	  var p = loadMetaSchemaOf(schema).then(function () {
	    var schemaObj = self._addSchema(schema, undefined, meta);
	    return schemaObj.validate || _compileAsync(schemaObj);
	  });

	  if (callback) {
	    p.then(
	      function(v) { callback(null, v); },
	      callback
	    );
	  }

	  return p;


	  function loadMetaSchemaOf(sch) {
	    var $schema = sch.$schema;
	    return $schema && !self.getSchema($schema)
	            ? compileAsync.call(self, { $ref: $schema }, true)
	            : Promise.resolve();
	  }


	  function _compileAsync(schemaObj) {
	    try { return self._compile(schemaObj); }
	    catch(e) {
	      if (e instanceof MissingRefError) return loadMissingSchema(e);
	      throw e;
	    }


	    function loadMissingSchema(e) {
	      var ref = e.missingSchema;
	      if (added(ref)) throw new Error('Schema ' + ref + ' is loaded but ' + e.missingRef + ' cannot be resolved');

	      var schemaPromise = self._loadingSchemas[ref];
	      if (!schemaPromise) {
	        schemaPromise = self._loadingSchemas[ref] = self._opts.loadSchema(ref);
	        schemaPromise.then(removePromise, removePromise);
	      }

	      return schemaPromise.then(function (sch) {
	        if (!added(ref)) {
	          return loadMetaSchemaOf(sch).then(function () {
	            if (!added(ref)) self.addSchema(sch, ref, undefined, meta);
	          });
	        }
	      }).then(function() {
	        return _compileAsync(schemaObj);
	      });

	      function removePromise() {
	        delete self._loadingSchemas[ref];
	      }

	      function added(ref) {
	        return self._refs[ref] || self._schemas[ref];
	      }
	    }
	  }
	}
	return async;
}

var custom$1;
var hasRequiredCustom;

function requireCustom () {
	if (hasRequiredCustom) return custom$1;
	hasRequiredCustom = 1;
	custom$1 = function generate_custom(it, $keyword, $ruleType) {
	  var out = ' ';
	  var $lvl = it.level;
	  var $dataLvl = it.dataLevel;
	  var $schema = it.schema[$keyword];
	  var $schemaPath = it.schemaPath + it.util.getProperty($keyword);
	  var $errSchemaPath = it.errSchemaPath + '/' + $keyword;
	  var $breakOnError = !it.opts.allErrors;
	  var $errorKeyword;
	  var $data = 'data' + ($dataLvl || '');
	  var $valid = 'valid' + $lvl;
	  var $errs = 'errs__' + $lvl;
	  var $isData = it.opts.$data && $schema && $schema.$data,
	    $schemaValue;
	  if ($isData) {
	    out += ' var schema' + ($lvl) + ' = ' + (it.util.getData($schema.$data, $dataLvl, it.dataPathArr)) + '; ';
	    $schemaValue = 'schema' + $lvl;
	  } else {
	    $schemaValue = $schema;
	  }
	  var $rule = this,
	    $definition = 'definition' + $lvl,
	    $rDef = $rule.definition,
	    $closingBraces = '';
	  var $compile, $inline, $macro, $ruleValidate, $validateCode;
	  if ($isData && $rDef.$data) {
	    $validateCode = 'keywordValidate' + $lvl;
	    var $validateSchema = $rDef.validateSchema;
	    out += ' var ' + ($definition) + ' = RULES.custom[\'' + ($keyword) + '\'].definition; var ' + ($validateCode) + ' = ' + ($definition) + '.validate;';
	  } else {
	    $ruleValidate = it.useCustomRule($rule, $schema, it.schema, it);
	    if (!$ruleValidate) return;
	    $schemaValue = 'validate.schema' + $schemaPath;
	    $validateCode = $ruleValidate.code;
	    $compile = $rDef.compile;
	    $inline = $rDef.inline;
	    $macro = $rDef.macro;
	  }
	  var $ruleErrs = $validateCode + '.errors',
	    $i = 'i' + $lvl,
	    $ruleErr = 'ruleErr' + $lvl,
	    $asyncKeyword = $rDef.async;
	  if ($asyncKeyword && !it.async) throw new Error('async keyword in sync schema');
	  if (!($inline || $macro)) {
	    out += '' + ($ruleErrs) + ' = null;';
	  }
	  out += 'var ' + ($errs) + ' = errors;var ' + ($valid) + ';';
	  if ($isData && $rDef.$data) {
	    $closingBraces += '}';
	    out += ' if (' + ($schemaValue) + ' === undefined) { ' + ($valid) + ' = true; } else { ';
	    if ($validateSchema) {
	      $closingBraces += '}';
	      out += ' ' + ($valid) + ' = ' + ($definition) + '.validateSchema(' + ($schemaValue) + '); if (' + ($valid) + ') { ';
	    }
	  }
	  if ($inline) {
	    if ($rDef.statements) {
	      out += ' ' + ($ruleValidate.validate) + ' ';
	    } else {
	      out += ' ' + ($valid) + ' = ' + ($ruleValidate.validate) + '; ';
	    }
	  } else if ($macro) {
	    var $it = it.util.copy(it);
	    var $closingBraces = '';
	    $it.level++;
	    var $nextValid = 'valid' + $it.level;
	    $it.schema = $ruleValidate.validate;
	    $it.schemaPath = '';
	    var $wasComposite = it.compositeRule;
	    it.compositeRule = $it.compositeRule = true;
	    var $code = it.validate($it).replace(/validate\.schema/g, $validateCode);
	    it.compositeRule = $it.compositeRule = $wasComposite;
	    out += ' ' + ($code);
	  } else {
	    var $$outStack = $$outStack || [];
	    $$outStack.push(out);
	    out = '';
	    out += '  ' + ($validateCode) + '.call( ';
	    if (it.opts.passContext) {
	      out += 'this';
	    } else {
	      out += 'self';
	    }
	    if ($compile || $rDef.schema === false) {
	      out += ' , ' + ($data) + ' ';
	    } else {
	      out += ' , ' + ($schemaValue) + ' , ' + ($data) + ' , validate.schema' + (it.schemaPath) + ' ';
	    }
	    out += ' , (dataPath || \'\')';
	    if (it.errorPath != '""') {
	      out += ' + ' + (it.errorPath);
	    }
	    var $parentData = $dataLvl ? 'data' + (($dataLvl - 1) || '') : 'parentData',
	      $parentDataProperty = $dataLvl ? it.dataPathArr[$dataLvl] : 'parentDataProperty';
	    out += ' , ' + ($parentData) + ' , ' + ($parentDataProperty) + ' , rootData )  ';
	    var def_callRuleValidate = out;
	    out = $$outStack.pop();
	    if ($rDef.errors === false) {
	      out += ' ' + ($valid) + ' = ';
	      if ($asyncKeyword) {
	        out += 'await ';
	      }
	      out += '' + (def_callRuleValidate) + '; ';
	    } else {
	      if ($asyncKeyword) {
	        $ruleErrs = 'customErrors' + $lvl;
	        out += ' var ' + ($ruleErrs) + ' = null; try { ' + ($valid) + ' = await ' + (def_callRuleValidate) + '; } catch (e) { ' + ($valid) + ' = false; if (e instanceof ValidationError) ' + ($ruleErrs) + ' = e.errors; else throw e; } ';
	      } else {
	        out += ' ' + ($ruleErrs) + ' = null; ' + ($valid) + ' = ' + (def_callRuleValidate) + '; ';
	      }
	    }
	  }
	  if ($rDef.modifying) {
	    out += ' if (' + ($parentData) + ') ' + ($data) + ' = ' + ($parentData) + '[' + ($parentDataProperty) + '];';
	  }
	  out += '' + ($closingBraces);
	  if ($rDef.valid) {
	    if ($breakOnError) {
	      out += ' if (true) { ';
	    }
	  } else {
	    out += ' if ( ';
	    if ($rDef.valid === undefined) {
	      out += ' !';
	      if ($macro) {
	        out += '' + ($nextValid);
	      } else {
	        out += '' + ($valid);
	      }
	    } else {
	      out += ' ' + (!$rDef.valid) + ' ';
	    }
	    out += ') { ';
	    $errorKeyword = $rule.keyword;
	    var $$outStack = $$outStack || [];
	    $$outStack.push(out);
	    out = '';
	    var $$outStack = $$outStack || [];
	    $$outStack.push(out);
	    out = ''; /* istanbul ignore else */
	    if (it.createErrors !== false) {
	      out += ' { keyword: \'' + ($errorKeyword || 'custom') + '\' , dataPath: (dataPath || \'\') + ' + (it.errorPath) + ' , schemaPath: ' + (it.util.toQuotedString($errSchemaPath)) + ' , params: { keyword: \'' + ($rule.keyword) + '\' } ';
	      if (it.opts.messages !== false) {
	        out += ' , message: \'should pass "' + ($rule.keyword) + '" keyword validation\' ';
	      }
	      if (it.opts.verbose) {
	        out += ' , schema: validate.schema' + ($schemaPath) + ' , parentSchema: validate.schema' + (it.schemaPath) + ' , data: ' + ($data) + ' ';
	      }
	      out += ' } ';
	    } else {
	      out += ' {} ';
	    }
	    var __err = out;
	    out = $$outStack.pop();
	    if (!it.compositeRule && $breakOnError) {
	      /* istanbul ignore if */
	      if (it.async) {
	        out += ' throw new ValidationError([' + (__err) + ']); ';
	      } else {
	        out += ' validate.errors = [' + (__err) + ']; return false; ';
	      }
	    } else {
	      out += ' var err = ' + (__err) + ';  if (vErrors === null) vErrors = [err]; else vErrors.push(err); errors++; ';
	    }
	    var def_customError = out;
	    out = $$outStack.pop();
	    if ($inline) {
	      if ($rDef.errors) {
	        if ($rDef.errors != 'full') {
	          out += '  for (var ' + ($i) + '=' + ($errs) + '; ' + ($i) + '<errors; ' + ($i) + '++) { var ' + ($ruleErr) + ' = vErrors[' + ($i) + ']; if (' + ($ruleErr) + '.dataPath === undefined) ' + ($ruleErr) + '.dataPath = (dataPath || \'\') + ' + (it.errorPath) + '; if (' + ($ruleErr) + '.schemaPath === undefined) { ' + ($ruleErr) + '.schemaPath = "' + ($errSchemaPath) + '"; } ';
	          if (it.opts.verbose) {
	            out += ' ' + ($ruleErr) + '.schema = ' + ($schemaValue) + '; ' + ($ruleErr) + '.data = ' + ($data) + '; ';
	          }
	          out += ' } ';
	        }
	      } else {
	        if ($rDef.errors === false) {
	          out += ' ' + (def_customError) + ' ';
	        } else {
	          out += ' if (' + ($errs) + ' == errors) { ' + (def_customError) + ' } else {  for (var ' + ($i) + '=' + ($errs) + '; ' + ($i) + '<errors; ' + ($i) + '++) { var ' + ($ruleErr) + ' = vErrors[' + ($i) + ']; if (' + ($ruleErr) + '.dataPath === undefined) ' + ($ruleErr) + '.dataPath = (dataPath || \'\') + ' + (it.errorPath) + '; if (' + ($ruleErr) + '.schemaPath === undefined) { ' + ($ruleErr) + '.schemaPath = "' + ($errSchemaPath) + '"; } ';
	          if (it.opts.verbose) {
	            out += ' ' + ($ruleErr) + '.schema = ' + ($schemaValue) + '; ' + ($ruleErr) + '.data = ' + ($data) + '; ';
	          }
	          out += ' } } ';
	        }
	      }
	    } else if ($macro) {
	      out += '   var err =   '; /* istanbul ignore else */
	      if (it.createErrors !== false) {
	        out += ' { keyword: \'' + ($errorKeyword || 'custom') + '\' , dataPath: (dataPath || \'\') + ' + (it.errorPath) + ' , schemaPath: ' + (it.util.toQuotedString($errSchemaPath)) + ' , params: { keyword: \'' + ($rule.keyword) + '\' } ';
	        if (it.opts.messages !== false) {
	          out += ' , message: \'should pass "' + ($rule.keyword) + '" keyword validation\' ';
	        }
	        if (it.opts.verbose) {
	          out += ' , schema: validate.schema' + ($schemaPath) + ' , parentSchema: validate.schema' + (it.schemaPath) + ' , data: ' + ($data) + ' ';
	        }
	        out += ' } ';
	      } else {
	        out += ' {} ';
	      }
	      out += ';  if (vErrors === null) vErrors = [err]; else vErrors.push(err); errors++; ';
	      if (!it.compositeRule && $breakOnError) {
	        /* istanbul ignore if */
	        if (it.async) {
	          out += ' throw new ValidationError(vErrors); ';
	        } else {
	          out += ' validate.errors = vErrors; return false; ';
	        }
	      }
	    } else {
	      if ($rDef.errors === false) {
	        out += ' ' + (def_customError) + ' ';
	      } else {
	        out += ' if (Array.isArray(' + ($ruleErrs) + ')) { if (vErrors === null) vErrors = ' + ($ruleErrs) + '; else vErrors = vErrors.concat(' + ($ruleErrs) + '); errors = vErrors.length;  for (var ' + ($i) + '=' + ($errs) + '; ' + ($i) + '<errors; ' + ($i) + '++) { var ' + ($ruleErr) + ' = vErrors[' + ($i) + ']; if (' + ($ruleErr) + '.dataPath === undefined) ' + ($ruleErr) + '.dataPath = (dataPath || \'\') + ' + (it.errorPath) + ';  ' + ($ruleErr) + '.schemaPath = "' + ($errSchemaPath) + '";  ';
	        if (it.opts.verbose) {
	          out += ' ' + ($ruleErr) + '.schema = ' + ($schemaValue) + '; ' + ($ruleErr) + '.data = ' + ($data) + '; ';
	        }
	        out += ' } } else { ' + (def_customError) + ' } ';
	      }
	    }
	    out += ' } ';
	    if ($breakOnError) {
	      out += ' else { ';
	    }
	  }
	  return out;
	};
	return custom$1;
}

var $schema$1 = "http://json-schema.org/draft-07/schema#";
var $id$1 = "http://json-schema.org/draft-07/schema#";
var title = "Core schema meta-schema";
var definitions = {
	schemaArray: {
		type: "array",
		minItems: 1,
		items: {
			$ref: "#"
		}
	},
	nonNegativeInteger: {
		type: "integer",
		minimum: 0
	},
	nonNegativeIntegerDefault0: {
		allOf: [
			{
				$ref: "#/definitions/nonNegativeInteger"
			},
			{
				"default": 0
			}
		]
	},
	simpleTypes: {
		"enum": [
			"array",
			"boolean",
			"integer",
			"null",
			"number",
			"object",
			"string"
		]
	},
	stringArray: {
		type: "array",
		items: {
			type: "string"
		},
		uniqueItems: true,
		"default": [
		]
	}
};
var type$1 = [
	"object",
	"boolean"
];
var properties$1 = {
	$id: {
		type: "string",
		format: "uri-reference"
	},
	$schema: {
		type: "string",
		format: "uri"
	},
	$ref: {
		type: "string",
		format: "uri-reference"
	},
	$comment: {
		type: "string"
	},
	title: {
		type: "string"
	},
	description: {
		type: "string"
	},
	"default": true,
	readOnly: {
		type: "boolean",
		"default": false
	},
	examples: {
		type: "array",
		items: true
	},
	multipleOf: {
		type: "number",
		exclusiveMinimum: 0
	},
	maximum: {
		type: "number"
	},
	exclusiveMaximum: {
		type: "number"
	},
	minimum: {
		type: "number"
	},
	exclusiveMinimum: {
		type: "number"
	},
	maxLength: {
		$ref: "#/definitions/nonNegativeInteger"
	},
	minLength: {
		$ref: "#/definitions/nonNegativeIntegerDefault0"
	},
	pattern: {
		type: "string",
		format: "regex"
	},
	additionalItems: {
		$ref: "#"
	},
	items: {
		anyOf: [
			{
				$ref: "#"
			},
			{
				$ref: "#/definitions/schemaArray"
			}
		],
		"default": true
	},
	maxItems: {
		$ref: "#/definitions/nonNegativeInteger"
	},
	minItems: {
		$ref: "#/definitions/nonNegativeIntegerDefault0"
	},
	uniqueItems: {
		type: "boolean",
		"default": false
	},
	contains: {
		$ref: "#"
	},
	maxProperties: {
		$ref: "#/definitions/nonNegativeInteger"
	},
	minProperties: {
		$ref: "#/definitions/nonNegativeIntegerDefault0"
	},
	required: {
		$ref: "#/definitions/stringArray"
	},
	additionalProperties: {
		$ref: "#"
	},
	definitions: {
		type: "object",
		additionalProperties: {
			$ref: "#"
		},
		"default": {
		}
	},
	properties: {
		type: "object",
		additionalProperties: {
			$ref: "#"
		},
		"default": {
		}
	},
	patternProperties: {
		type: "object",
		additionalProperties: {
			$ref: "#"
		},
		propertyNames: {
			format: "regex"
		},
		"default": {
		}
	},
	dependencies: {
		type: "object",
		additionalProperties: {
			anyOf: [
				{
					$ref: "#"
				},
				{
					$ref: "#/definitions/stringArray"
				}
			]
		}
	},
	propertyNames: {
		$ref: "#"
	},
	"const": true,
	"enum": {
		type: "array",
		items: true,
		minItems: 1,
		uniqueItems: true
	},
	type: {
		anyOf: [
			{
				$ref: "#/definitions/simpleTypes"
			},
			{
				type: "array",
				items: {
					$ref: "#/definitions/simpleTypes"
				},
				minItems: 1,
				uniqueItems: true
			}
		]
	},
	format: {
		type: "string"
	},
	contentMediaType: {
		type: "string"
	},
	contentEncoding: {
		type: "string"
	},
	"if": {
		$ref: "#"
	},
	then: {
		$ref: "#"
	},
	"else": {
		$ref: "#"
	},
	allOf: {
		$ref: "#/definitions/schemaArray"
	},
	anyOf: {
		$ref: "#/definitions/schemaArray"
	},
	oneOf: {
		$ref: "#/definitions/schemaArray"
	},
	not: {
		$ref: "#"
	}
};
var require$$13 = {
	$schema: $schema$1,
	$id: $id$1,
	title: title,
	definitions: definitions,
	type: type$1,
	properties: properties$1,
	"default": true
};

var definition_schema;
var hasRequiredDefinition_schema;

function requireDefinition_schema () {
	if (hasRequiredDefinition_schema) return definition_schema;
	hasRequiredDefinition_schema = 1;

	var metaSchema = require$$13;

	definition_schema = {
	  $id: 'https://github.com/ajv-validator/ajv/blob/master/lib/definition_schema.js',
	  definitions: {
	    simpleTypes: metaSchema.definitions.simpleTypes
	  },
	  type: 'object',
	  dependencies: {
	    schema: ['validate'],
	    $data: ['validate'],
	    statements: ['inline'],
	    valid: {not: {required: ['macro']}}
	  },
	  properties: {
	    type: metaSchema.properties.type,
	    schema: {type: 'boolean'},
	    statements: {type: 'boolean'},
	    dependencies: {
	      type: 'array',
	      items: {type: 'string'}
	    },
	    metaSchema: {type: 'object'},
	    modifying: {type: 'boolean'},
	    valid: {type: 'boolean'},
	    $data: {type: 'boolean'},
	    async: {type: 'boolean'},
	    errors: {
	      anyOf: [
	        {type: 'boolean'},
	        {const: 'full'}
	      ]
	    }
	  }
	};
	return definition_schema;
}

var keyword;
var hasRequiredKeyword;

function requireKeyword () {
	if (hasRequiredKeyword) return keyword;
	hasRequiredKeyword = 1;

	var IDENTIFIER = /^[a-z_$][a-z0-9_$-]*$/i;
	var customRuleCode = requireCustom();
	var definitionSchema = requireDefinition_schema();

	keyword = {
	  add: addKeyword,
	  get: getKeyword,
	  remove: removeKeyword,
	  validate: validateKeyword
	};


	/**
	 * Define custom keyword
	 * @this  Ajv
	 * @param {String} keyword custom keyword, should be unique (including different from all standard, custom and macro keywords).
	 * @param {Object} definition keyword definition object with properties `type` (type(s) which the keyword applies to), `validate` or `compile`.
	 * @return {Ajv} this for method chaining
	 */
	function addKeyword(keyword, definition) {
	  /* jshint validthis: true */
	  /* eslint no-shadow: 0 */
	  var RULES = this.RULES;
	  if (RULES.keywords[keyword])
	    throw new Error('Keyword ' + keyword + ' is already defined');

	  if (!IDENTIFIER.test(keyword))
	    throw new Error('Keyword ' + keyword + ' is not a valid identifier');

	  if (definition) {
	    this.validateKeyword(definition, true);

	    var dataType = definition.type;
	    if (Array.isArray(dataType)) {
	      for (var i=0; i<dataType.length; i++)
	        _addRule(keyword, dataType[i], definition);
	    } else {
	      _addRule(keyword, dataType, definition);
	    }

	    var metaSchema = definition.metaSchema;
	    if (metaSchema) {
	      if (definition.$data && this._opts.$data) {
	        metaSchema = {
	          anyOf: [
	            metaSchema,
	            { '$ref': 'https://raw.githubusercontent.com/ajv-validator/ajv/master/lib/refs/data.json#' }
	          ]
	        };
	      }
	      definition.validateSchema = this.compile(metaSchema, true);
	    }
	  }

	  RULES.keywords[keyword] = RULES.all[keyword] = true;


	  function _addRule(keyword, dataType, definition) {
	    var ruleGroup;
	    for (var i=0; i<RULES.length; i++) {
	      var rg = RULES[i];
	      if (rg.type == dataType) {
	        ruleGroup = rg;
	        break;
	      }
	    }

	    if (!ruleGroup) {
	      ruleGroup = { type: dataType, rules: [] };
	      RULES.push(ruleGroup);
	    }

	    var rule = {
	      keyword: keyword,
	      definition: definition,
	      custom: true,
	      code: customRuleCode,
	      implements: definition.implements
	    };
	    ruleGroup.rules.push(rule);
	    RULES.custom[keyword] = rule;
	  }

	  return this;
	}


	/**
	 * Get keyword
	 * @this  Ajv
	 * @param {String} keyword pre-defined or custom keyword.
	 * @return {Object|Boolean} custom keyword definition, `true` if it is a predefined keyword, `false` otherwise.
	 */
	function getKeyword(keyword) {
	  /* jshint validthis: true */
	  var rule = this.RULES.custom[keyword];
	  return rule ? rule.definition : this.RULES.keywords[keyword] || false;
	}


	/**
	 * Remove keyword
	 * @this  Ajv
	 * @param {String} keyword pre-defined or custom keyword.
	 * @return {Ajv} this for method chaining
	 */
	function removeKeyword(keyword) {
	  /* jshint validthis: true */
	  var RULES = this.RULES;
	  delete RULES.keywords[keyword];
	  delete RULES.all[keyword];
	  delete RULES.custom[keyword];
	  for (var i=0; i<RULES.length; i++) {
	    var rules = RULES[i].rules;
	    for (var j=0; j<rules.length; j++) {
	      if (rules[j].keyword == keyword) {
	        rules.splice(j, 1);
	        break;
	      }
	    }
	  }
	  return this;
	}


	/**
	 * Validate keyword definition
	 * @this  Ajv
	 * @param {Object} definition keyword definition object.
	 * @param {Boolean} throwError true to throw exception if definition is invalid
	 * @return {boolean} validation result
	 */
	function validateKeyword(definition, throwError) {
	  validateKeyword.errors = null;
	  var v = this._validateKeyword = this._validateKeyword
	                                  || this.compile(definitionSchema, true);

	  if (v(definition)) return true;
	  validateKeyword.errors = v.errors;
	  if (throwError)
	    throw new Error('custom keyword definition is invalid: '  + this.errorsText(v.errors));
	  else
	    return false;
	}
	return keyword;
}

var $schema = "http://json-schema.org/draft-07/schema#";
var $id = "https://raw.githubusercontent.com/ajv-validator/ajv/master/lib/refs/data.json#";
var description = "Meta-schema for $data reference (JSON Schema extension proposal)";
var type = "object";
var required = [
	"$data"
];
var properties = {
	$data: {
		type: "string",
		anyOf: [
			{
				format: "relative-json-pointer"
			},
			{
				format: "json-pointer"
			}
		]
	}
};
var additionalProperties = false;
var require$$12 = {
	$schema: $schema,
	$id: $id,
	description: description,
	type: type,
	required: required,
	properties: properties,
	additionalProperties: additionalProperties
};

var ajv;
var hasRequiredAjv;

function requireAjv () {
	if (hasRequiredAjv) return ajv;
	hasRequiredAjv = 1;

	var compileSchema = requireCompile()
	  , resolve = requireResolve()
	  , Cache = requireCache()
	  , SchemaObject = requireSchema_obj()
	  , stableStringify = requireFastJsonStableStringify()
	  , formats = requireFormats()
	  , rules = requireRules()
	  , $dataMetaSchema = requireData()
	  , util = requireUtil();

	ajv = Ajv;

	Ajv.prototype.validate = validate;
	Ajv.prototype.compile = compile;
	Ajv.prototype.addSchema = addSchema;
	Ajv.prototype.addMetaSchema = addMetaSchema;
	Ajv.prototype.validateSchema = validateSchema;
	Ajv.prototype.getSchema = getSchema;
	Ajv.prototype.removeSchema = removeSchema;
	Ajv.prototype.addFormat = addFormat;
	Ajv.prototype.errorsText = errorsText;

	Ajv.prototype._addSchema = _addSchema;
	Ajv.prototype._compile = _compile;

	Ajv.prototype.compileAsync = requireAsync();
	var customKeyword = requireKeyword();
	Ajv.prototype.addKeyword = customKeyword.add;
	Ajv.prototype.getKeyword = customKeyword.get;
	Ajv.prototype.removeKeyword = customKeyword.remove;
	Ajv.prototype.validateKeyword = customKeyword.validate;

	var errorClasses = requireError_classes();
	Ajv.ValidationError = errorClasses.Validation;
	Ajv.MissingRefError = errorClasses.MissingRef;
	Ajv.$dataMetaSchema = $dataMetaSchema;

	var META_SCHEMA_ID = 'http://json-schema.org/draft-07/schema';

	var META_IGNORE_OPTIONS = [ 'removeAdditional', 'useDefaults', 'coerceTypes', 'strictDefaults' ];
	var META_SUPPORT_DATA = ['/properties'];

	/**
	 * Creates validator instance.
	 * Usage: `Ajv(opts)`
	 * @param {Object} opts optional options
	 * @return {Object} ajv instance
	 */
	function Ajv(opts) {
	  if (!(this instanceof Ajv)) return new Ajv(opts);
	  opts = this._opts = util.copy(opts) || {};
	  setLogger(this);
	  this._schemas = {};
	  this._refs = {};
	  this._fragments = {};
	  this._formats = formats(opts.format);

	  this._cache = opts.cache || new Cache;
	  this._loadingSchemas = {};
	  this._compilations = [];
	  this.RULES = rules();
	  this._getId = chooseGetId(opts);

	  opts.loopRequired = opts.loopRequired || Infinity;
	  if (opts.errorDataPath == 'property') opts._errorDataPathProperty = true;
	  if (opts.serialize === undefined) opts.serialize = stableStringify;
	  this._metaOpts = getMetaSchemaOptions(this);

	  if (opts.formats) addInitialFormats(this);
	  if (opts.keywords) addInitialKeywords(this);
	  addDefaultMetaSchema(this);
	  if (typeof opts.meta == 'object') this.addMetaSchema(opts.meta);
	  if (opts.nullable) this.addKeyword('nullable', {metaSchema: {type: 'boolean'}});
	  addInitialSchemas(this);
	}



	/**
	 * Validate data using schema
	 * Schema will be compiled and cached (using serialized JSON as key. [fast-json-stable-stringify](https://github.com/epoberezkin/fast-json-stable-stringify) is used to serialize.
	 * @this   Ajv
	 * @param  {String|Object} schemaKeyRef key, ref or schema object
	 * @param  {Any} data to be validated
	 * @return {Boolean} validation result. Errors from the last validation will be available in `ajv.errors` (and also in compiled schema: `schema.errors`).
	 */
	function validate(schemaKeyRef, data) {
	  var v;
	  if (typeof schemaKeyRef == 'string') {
	    v = this.getSchema(schemaKeyRef);
	    if (!v) throw new Error('no schema with key or ref "' + schemaKeyRef + '"');
	  } else {
	    var schemaObj = this._addSchema(schemaKeyRef);
	    v = schemaObj.validate || this._compile(schemaObj);
	  }

	  var valid = v(data);
	  if (v.$async !== true) this.errors = v.errors;
	  return valid;
	}


	/**
	 * Create validating function for passed schema.
	 * @this   Ajv
	 * @param  {Object} schema schema object
	 * @param  {Boolean} _meta true if schema is a meta-schema. Used internally to compile meta schemas of custom keywords.
	 * @return {Function} validating function
	 */
	function compile(schema, _meta) {
	  var schemaObj = this._addSchema(schema, undefined, _meta);
	  return schemaObj.validate || this._compile(schemaObj);
	}


	/**
	 * Adds schema to the instance.
	 * @this   Ajv
	 * @param {Object|Array} schema schema or array of schemas. If array is passed, `key` and other parameters will be ignored.
	 * @param {String} key Optional schema key. Can be passed to `validate` method instead of schema object or id/ref. One schema per instance can have empty `id` and `key`.
	 * @param {Boolean} _skipValidation true to skip schema validation. Used internally, option validateSchema should be used instead.
	 * @param {Boolean} _meta true if schema is a meta-schema. Used internally, addMetaSchema should be used instead.
	 * @return {Ajv} this for method chaining
	 */
	function addSchema(schema, key, _skipValidation, _meta) {
	  if (Array.isArray(schema)){
	    for (var i=0; i<schema.length; i++) this.addSchema(schema[i], undefined, _skipValidation, _meta);
	    return this;
	  }
	  var id = this._getId(schema);
	  if (id !== undefined && typeof id != 'string')
	    throw new Error('schema id must be string');
	  key = resolve.normalizeId(key || id);
	  checkUnique(this, key);
	  this._schemas[key] = this._addSchema(schema, _skipValidation, _meta, true);
	  return this;
	}


	/**
	 * Add schema that will be used to validate other schemas
	 * options in META_IGNORE_OPTIONS are alway set to false
	 * @this   Ajv
	 * @param {Object} schema schema object
	 * @param {String} key optional schema key
	 * @param {Boolean} skipValidation true to skip schema validation, can be used to override validateSchema option for meta-schema
	 * @return {Ajv} this for method chaining
	 */
	function addMetaSchema(schema, key, skipValidation) {
	  this.addSchema(schema, key, skipValidation, true);
	  return this;
	}


	/**
	 * Validate schema
	 * @this   Ajv
	 * @param {Object} schema schema to validate
	 * @param {Boolean} throwOrLogError pass true to throw (or log) an error if invalid
	 * @return {Boolean} true if schema is valid
	 */
	function validateSchema(schema, throwOrLogError) {
	  var $schema = schema.$schema;
	  if ($schema !== undefined && typeof $schema != 'string')
	    throw new Error('$schema must be a string');
	  $schema = $schema || this._opts.defaultMeta || defaultMeta(this);
	  if (!$schema) {
	    this.logger.warn('meta-schema not available');
	    this.errors = null;
	    return true;
	  }
	  var valid = this.validate($schema, schema);
	  if (!valid && throwOrLogError) {
	    var message = 'schema is invalid: ' + this.errorsText();
	    if (this._opts.validateSchema == 'log') this.logger.error(message);
	    else throw new Error(message);
	  }
	  return valid;
	}


	function defaultMeta(self) {
	  var meta = self._opts.meta;
	  self._opts.defaultMeta = typeof meta == 'object'
	                            ? self._getId(meta) || meta
	                            : self.getSchema(META_SCHEMA_ID)
	                              ? META_SCHEMA_ID
	                              : undefined;
	  return self._opts.defaultMeta;
	}


	/**
	 * Get compiled schema from the instance by `key` or `ref`.
	 * @this   Ajv
	 * @param  {String} keyRef `key` that was passed to `addSchema` or full schema reference (`schema.id` or resolved id).
	 * @return {Function} schema validating function (with property `schema`).
	 */
	function getSchema(keyRef) {
	  var schemaObj = _getSchemaObj(this, keyRef);
	  switch (typeof schemaObj) {
	    case 'object': return schemaObj.validate || this._compile(schemaObj);
	    case 'string': return this.getSchema(schemaObj);
	    case 'undefined': return _getSchemaFragment(this, keyRef);
	  }
	}


	function _getSchemaFragment(self, ref) {
	  var res = resolve.schema.call(self, { schema: {} }, ref);
	  if (res) {
	    var schema = res.schema
	      , root = res.root
	      , baseId = res.baseId;
	    var v = compileSchema.call(self, schema, root, undefined, baseId);
	    self._fragments[ref] = new SchemaObject({
	      ref: ref,
	      fragment: true,
	      schema: schema,
	      root: root,
	      baseId: baseId,
	      validate: v
	    });
	    return v;
	  }
	}


	function _getSchemaObj(self, keyRef) {
	  keyRef = resolve.normalizeId(keyRef);
	  return self._schemas[keyRef] || self._refs[keyRef] || self._fragments[keyRef];
	}


	/**
	 * Remove cached schema(s).
	 * If no parameter is passed all schemas but meta-schemas are removed.
	 * If RegExp is passed all schemas with key/id matching pattern but meta-schemas are removed.
	 * Even if schema is referenced by other schemas it still can be removed as other schemas have local references.
	 * @this   Ajv
	 * @param  {String|Object|RegExp} schemaKeyRef key, ref, pattern to match key/ref or schema object
	 * @return {Ajv} this for method chaining
	 */
	function removeSchema(schemaKeyRef) {
	  if (schemaKeyRef instanceof RegExp) {
	    _removeAllSchemas(this, this._schemas, schemaKeyRef);
	    _removeAllSchemas(this, this._refs, schemaKeyRef);
	    return this;
	  }
	  switch (typeof schemaKeyRef) {
	    case 'undefined':
	      _removeAllSchemas(this, this._schemas);
	      _removeAllSchemas(this, this._refs);
	      this._cache.clear();
	      return this;
	    case 'string':
	      var schemaObj = _getSchemaObj(this, schemaKeyRef);
	      if (schemaObj) this._cache.del(schemaObj.cacheKey);
	      delete this._schemas[schemaKeyRef];
	      delete this._refs[schemaKeyRef];
	      return this;
	    case 'object':
	      var serialize = this._opts.serialize;
	      var cacheKey = serialize ? serialize(schemaKeyRef) : schemaKeyRef;
	      this._cache.del(cacheKey);
	      var id = this._getId(schemaKeyRef);
	      if (id) {
	        id = resolve.normalizeId(id);
	        delete this._schemas[id];
	        delete this._refs[id];
	      }
	  }
	  return this;
	}


	function _removeAllSchemas(self, schemas, regex) {
	  for (var keyRef in schemas) {
	    var schemaObj = schemas[keyRef];
	    if (!schemaObj.meta && (!regex || regex.test(keyRef))) {
	      self._cache.del(schemaObj.cacheKey);
	      delete schemas[keyRef];
	    }
	  }
	}


	/* @this   Ajv */
	function _addSchema(schema, skipValidation, meta, shouldAddSchema) {
	  if (typeof schema != 'object' && typeof schema != 'boolean')
	    throw new Error('schema should be object or boolean');
	  var serialize = this._opts.serialize;
	  var cacheKey = serialize ? serialize(schema) : schema;
	  var cached = this._cache.get(cacheKey);
	  if (cached) return cached;

	  shouldAddSchema = shouldAddSchema || this._opts.addUsedSchema !== false;

	  var id = resolve.normalizeId(this._getId(schema));
	  if (id && shouldAddSchema) checkUnique(this, id);

	  var willValidate = this._opts.validateSchema !== false && !skipValidation;
	  var recursiveMeta;
	  if (willValidate && !(recursiveMeta = id && id == resolve.normalizeId(schema.$schema)))
	    this.validateSchema(schema, true);

	  var localRefs = resolve.ids.call(this, schema);

	  var schemaObj = new SchemaObject({
	    id: id,
	    schema: schema,
	    localRefs: localRefs,
	    cacheKey: cacheKey,
	    meta: meta
	  });

	  if (id[0] != '#' && shouldAddSchema) this._refs[id] = schemaObj;
	  this._cache.put(cacheKey, schemaObj);

	  if (willValidate && recursiveMeta) this.validateSchema(schema, true);

	  return schemaObj;
	}


	/* @this   Ajv */
	function _compile(schemaObj, root) {
	  if (schemaObj.compiling) {
	    schemaObj.validate = callValidate;
	    callValidate.schema = schemaObj.schema;
	    callValidate.errors = null;
	    callValidate.root = root ? root : callValidate;
	    if (schemaObj.schema.$async === true)
	      callValidate.$async = true;
	    return callValidate;
	  }
	  schemaObj.compiling = true;

	  var currentOpts;
	  if (schemaObj.meta) {
	    currentOpts = this._opts;
	    this._opts = this._metaOpts;
	  }

	  var v;
	  try { v = compileSchema.call(this, schemaObj.schema, root, schemaObj.localRefs); }
	  catch(e) {
	    delete schemaObj.validate;
	    throw e;
	  }
	  finally {
	    schemaObj.compiling = false;
	    if (schemaObj.meta) this._opts = currentOpts;
	  }

	  schemaObj.validate = v;
	  schemaObj.refs = v.refs;
	  schemaObj.refVal = v.refVal;
	  schemaObj.root = v.root;
	  return v;


	  /* @this   {*} - custom context, see passContext option */
	  function callValidate() {
	    /* jshint validthis: true */
	    var _validate = schemaObj.validate;
	    var result = _validate.apply(this, arguments);
	    callValidate.errors = _validate.errors;
	    return result;
	  }
	}


	function chooseGetId(opts) {
	  switch (opts.schemaId) {
	    case 'auto': return _get$IdOrId;
	    case 'id': return _getId;
	    default: return _get$Id;
	  }
	}

	/* @this   Ajv */
	function _getId(schema) {
	  if (schema.$id) this.logger.warn('schema $id ignored', schema.$id);
	  return schema.id;
	}

	/* @this   Ajv */
	function _get$Id(schema) {
	  if (schema.id) this.logger.warn('schema id ignored', schema.id);
	  return schema.$id;
	}


	function _get$IdOrId(schema) {
	  if (schema.$id && schema.id && schema.$id != schema.id)
	    throw new Error('schema $id is different from id');
	  return schema.$id || schema.id;
	}


	/**
	 * Convert array of error message objects to string
	 * @this   Ajv
	 * @param  {Array<Object>} errors optional array of validation errors, if not passed errors from the instance are used.
	 * @param  {Object} options optional options with properties `separator` and `dataVar`.
	 * @return {String} human readable string with all errors descriptions
	 */
	function errorsText(errors, options) {
	  errors = errors || this.errors;
	  if (!errors) return 'No errors';
	  options = options || {};
	  var separator = options.separator === undefined ? ', ' : options.separator;
	  var dataVar = options.dataVar === undefined ? 'data' : options.dataVar;

	  var text = '';
	  for (var i=0; i<errors.length; i++) {
	    var e = errors[i];
	    if (e) text += dataVar + e.dataPath + ' ' + e.message + separator;
	  }
	  return text.slice(0, -separator.length);
	}


	/**
	 * Add custom format
	 * @this   Ajv
	 * @param {String} name format name
	 * @param {String|RegExp|Function} format string is converted to RegExp; function should return boolean (true when valid)
	 * @return {Ajv} this for method chaining
	 */
	function addFormat(name, format) {
	  if (typeof format == 'string') format = new RegExp(format);
	  this._formats[name] = format;
	  return this;
	}


	function addDefaultMetaSchema(self) {
	  var $dataSchema;
	  if (self._opts.$data) {
	    $dataSchema = require$$12;
	    self.addMetaSchema($dataSchema, $dataSchema.$id, true);
	  }
	  if (self._opts.meta === false) return;
	  var metaSchema = require$$13;
	  if (self._opts.$data) metaSchema = $dataMetaSchema(metaSchema, META_SUPPORT_DATA);
	  self.addMetaSchema(metaSchema, META_SCHEMA_ID, true);
	  self._refs['http://json-schema.org/schema'] = META_SCHEMA_ID;
	}


	function addInitialSchemas(self) {
	  var optsSchemas = self._opts.schemas;
	  if (!optsSchemas) return;
	  if (Array.isArray(optsSchemas)) self.addSchema(optsSchemas);
	  else for (var key in optsSchemas) self.addSchema(optsSchemas[key], key);
	}


	function addInitialFormats(self) {
	  for (var name in self._opts.formats) {
	    var format = self._opts.formats[name];
	    self.addFormat(name, format);
	  }
	}


	function addInitialKeywords(self) {
	  for (var name in self._opts.keywords) {
	    var keyword = self._opts.keywords[name];
	    self.addKeyword(name, keyword);
	  }
	}


	function checkUnique(self, id) {
	  if (self._schemas[id] || self._refs[id])
	    throw new Error('schema with key or id "' + id + '" already exists');
	}


	function getMetaSchemaOptions(self) {
	  var metaOpts = util.copy(self._opts);
	  for (var i=0; i<META_IGNORE_OPTIONS.length; i++)
	    delete metaOpts[META_IGNORE_OPTIONS[i]];
	  return metaOpts;
	}


	function setLogger(self) {
	  var logger = self._opts.logger;
	  if (logger === false) {
	    self.logger = {log: noop, warn: noop, error: noop};
	  } else {
	    if (logger === undefined) logger = console;
	    if (!(typeof logger == 'object' && logger.log && logger.warn && logger.error))
	      throw new Error('logger must implement log, warn and error methods');
	    self.logger = logger;
	  }
	}


	function noop() {}
	return ajv;
}

var ajvExports = requireAjv();
var Ajv = /*@__PURE__*/getDefaultExportFromCjs(ajvExports);

/**
 * An MCP client on top of a pluggable transport.
 *
 * The client will automatically begin the initialization flow with the server when connect() is called.
 *
 * To use with custom types, extend the base Request/Notification/Result types and pass them as type parameters:
 *
 * ```typescript
 * // Custom schemas
 * const CustomRequestSchema = RequestSchema.extend({...})
 * const CustomNotificationSchema = NotificationSchema.extend({...})
 * const CustomResultSchema = ResultSchema.extend({...})
 *
 * // Type aliases
 * type CustomRequest = z.infer<typeof CustomRequestSchema>
 * type CustomNotification = z.infer<typeof CustomNotificationSchema>
 * type CustomResult = z.infer<typeof CustomResultSchema>
 *
 * // Create typed client
 * const client = new Client<CustomRequest, CustomNotification, CustomResult>({
 *   name: "CustomClient",
 *   version: "1.0.0"
 * })
 * ```
 */
class Client extends Protocol {
    /**
     * Initializes this client with the given name and version information.
     */
    constructor(_clientInfo, options) {
        var _a;
        super(options);
        this._clientInfo = _clientInfo;
        this._cachedToolOutputValidators = new Map();
        this._capabilities = (_a = options === null || options === void 0 ? void 0 : options.capabilities) !== null && _a !== void 0 ? _a : {};
        this._ajv = new Ajv();
    }
    /**
     * Registers new capabilities. This can only be called before connecting to a transport.
     *
     * The new capabilities will be merged with any existing capabilities previously given (e.g., at initialization).
     */
    registerCapabilities(capabilities) {
        if (this.transport) {
            throw new Error("Cannot register capabilities after connecting to transport");
        }
        this._capabilities = mergeCapabilities(this._capabilities, capabilities);
    }
    assertCapability(capability, method) {
        var _a;
        if (!((_a = this._serverCapabilities) === null || _a === void 0 ? void 0 : _a[capability])) {
            throw new Error(`Server does not support ${capability} (required for ${method})`);
        }
    }
    async connect(transport, options) {
        await super.connect(transport);
        // When transport sessionId is already set this means we are trying to reconnect.
        // In this case we don't need to initialize again.
        if (transport.sessionId !== undefined) {
            return;
        }
        try {
            const result = await this.request({
                method: "initialize",
                params: {
                    protocolVersion: LATEST_PROTOCOL_VERSION,
                    capabilities: this._capabilities,
                    clientInfo: this._clientInfo,
                },
            }, InitializeResultSchema, options);
            if (result === undefined) {
                throw new Error(`Server sent invalid initialize result: ${result}`);
            }
            if (!SUPPORTED_PROTOCOL_VERSIONS.includes(result.protocolVersion)) {
                throw new Error(`Server's protocol version is not supported: ${result.protocolVersion}`);
            }
            this._serverCapabilities = result.capabilities;
            this._serverVersion = result.serverInfo;
            // HTTP transports must set the protocol version in each header after initialization.
            if (transport.setProtocolVersion) {
                transport.setProtocolVersion(result.protocolVersion);
            }
            this._instructions = result.instructions;
            await this.notification({
                method: "notifications/initialized",
            });
        }
        catch (error) {
            // Disconnect if initialization fails.
            void this.close();
            throw error;
        }
    }
    /**
     * After initialization has completed, this will be populated with the server's reported capabilities.
     */
    getServerCapabilities() {
        return this._serverCapabilities;
    }
    /**
     * After initialization has completed, this will be populated with information about the server's name and version.
     */
    getServerVersion() {
        return this._serverVersion;
    }
    /**
     * After initialization has completed, this may be populated with information about the server's instructions.
     */
    getInstructions() {
        return this._instructions;
    }
    assertCapabilityForMethod(method) {
        var _a, _b, _c, _d, _e;
        switch (method) {
            case "logging/setLevel":
                if (!((_a = this._serverCapabilities) === null || _a === void 0 ? void 0 : _a.logging)) {
                    throw new Error(`Server does not support logging (required for ${method})`);
                }
                break;
            case "prompts/get":
            case "prompts/list":
                if (!((_b = this._serverCapabilities) === null || _b === void 0 ? void 0 : _b.prompts)) {
                    throw new Error(`Server does not support prompts (required for ${method})`);
                }
                break;
            case "resources/list":
            case "resources/templates/list":
            case "resources/read":
            case "resources/subscribe":
            case "resources/unsubscribe":
                if (!((_c = this._serverCapabilities) === null || _c === void 0 ? void 0 : _c.resources)) {
                    throw new Error(`Server does not support resources (required for ${method})`);
                }
                if (method === "resources/subscribe" &&
                    !this._serverCapabilities.resources.subscribe) {
                    throw new Error(`Server does not support resource subscriptions (required for ${method})`);
                }
                break;
            case "tools/call":
            case "tools/list":
                if (!((_d = this._serverCapabilities) === null || _d === void 0 ? void 0 : _d.tools)) {
                    throw new Error(`Server does not support tools (required for ${method})`);
                }
                break;
            case "completion/complete":
                if (!((_e = this._serverCapabilities) === null || _e === void 0 ? void 0 : _e.completions)) {
                    throw new Error(`Server does not support completions (required for ${method})`);
                }
                break;
        }
    }
    assertNotificationCapability(method) {
        var _a;
        switch (method) {
            case "notifications/roots/list_changed":
                if (!((_a = this._capabilities.roots) === null || _a === void 0 ? void 0 : _a.listChanged)) {
                    throw new Error(`Client does not support roots list changed notifications (required for ${method})`);
                }
                break;
        }
    }
    assertRequestHandlerCapability(method) {
        switch (method) {
            case "sampling/createMessage":
                if (!this._capabilities.sampling) {
                    throw new Error(`Client does not support sampling capability (required for ${method})`);
                }
                break;
            case "elicitation/create":
                if (!this._capabilities.elicitation) {
                    throw new Error(`Client does not support elicitation capability (required for ${method})`);
                }
                break;
            case "roots/list":
                if (!this._capabilities.roots) {
                    throw new Error(`Client does not support roots capability (required for ${method})`);
                }
                break;
        }
    }
    async ping(options) {
        return this.request({ method: "ping" }, EmptyResultSchema, options);
    }
    async complete(params, options) {
        return this.request({ method: "completion/complete", params }, CompleteResultSchema, options);
    }
    async setLoggingLevel(level, options) {
        return this.request({ method: "logging/setLevel", params: { level } }, EmptyResultSchema, options);
    }
    async getPrompt(params, options) {
        return this.request({ method: "prompts/get", params }, GetPromptResultSchema, options);
    }
    async listPrompts(params, options) {
        return this.request({ method: "prompts/list", params }, ListPromptsResultSchema, options);
    }
    async listResources(params, options) {
        return this.request({ method: "resources/list", params }, ListResourcesResultSchema, options);
    }
    async listResourceTemplates(params, options) {
        return this.request({ method: "resources/templates/list", params }, ListResourceTemplatesResultSchema, options);
    }
    async readResource(params, options) {
        return this.request({ method: "resources/read", params }, ReadResourceResultSchema, options);
    }
    async subscribeResource(params, options) {
        return this.request({ method: "resources/subscribe", params }, EmptyResultSchema, options);
    }
    async unsubscribeResource(params, options) {
        return this.request({ method: "resources/unsubscribe", params }, EmptyResultSchema, options);
    }
    async callTool(params, resultSchema = CallToolResultSchema, options) {
        const result = await this.request({ method: "tools/call", params }, resultSchema, options);
        // Check if the tool has an outputSchema
        const validator = this.getToolOutputValidator(params.name);
        if (validator) {
            // If tool has outputSchema, it MUST return structuredContent (unless it's an error)
            if (!result.structuredContent && !result.isError) {
                throw new McpError(ErrorCode.InvalidRequest, `Tool ${params.name} has an output schema but did not return structured content`);
            }
            // Only validate structured content if present (not when there's an error)
            if (result.structuredContent) {
                try {
                    // Validate the structured content (which is already an object) against the schema
                    const isValid = validator(result.structuredContent);
                    if (!isValid) {
                        throw new McpError(ErrorCode.InvalidParams, `Structured content does not match the tool's output schema: ${this._ajv.errorsText(validator.errors)}`);
                    }
                }
                catch (error) {
                    if (error instanceof McpError) {
                        throw error;
                    }
                    throw new McpError(ErrorCode.InvalidParams, `Failed to validate structured content: ${error instanceof Error ? error.message : String(error)}`);
                }
            }
        }
        return result;
    }
    cacheToolOutputSchemas(tools) {
        this._cachedToolOutputValidators.clear();
        for (const tool of tools) {
            // If the tool has an outputSchema, create and cache the Ajv validator
            if (tool.outputSchema) {
                try {
                    const validator = this._ajv.compile(tool.outputSchema);
                    this._cachedToolOutputValidators.set(tool.name, validator);
                }
                catch (_a) {
                    // Ignore schema compilation errors
                }
            }
        }
    }
    getToolOutputValidator(toolName) {
        return this._cachedToolOutputValidators.get(toolName);
    }
    async listTools(params, options) {
        const result = await this.request({ method: "tools/list", params }, ListToolsResultSchema, options);
        // Cache the tools and their output schemas for future validation
        this.cacheToolOutputSchemas(result.tools);
        return result;
    }
    async sendRootsListChanged() {
        return this.notification({ method: "notifications/roots/list_changed" });
    }
}

let crypto;
crypto =
    globalThis.crypto?.webcrypto ?? // Node.js [18-16] REPL
        globalThis.crypto ?? // Node.js >18
        import('node:crypto').then(m => m.webcrypto); // Node.js <18 Non-REPL
/**
 * Creates an array of length `size` of random bytes
 * @param size
 * @returns Array of random ints (0 to 255)
 */
async function getRandomValues(size) {
    return (await crypto).getRandomValues(new Uint8Array(size));
}
/** Generate cryptographically strong random string
 * @param size The desired length of the string
 * @returns The random string
 */
async function random(size) {
    const mask = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789-._~";
    let result = "";
    const randomUints = await getRandomValues(size);
    for (let i = 0; i < size; i++) {
        // cap the value of the randomIndex to mask.length - 1
        const randomIndex = randomUints[i] % mask.length;
        result += mask[randomIndex];
    }
    return result;
}
/** Generate a PKCE challenge verifier
 * @param length Length of the verifier
 * @returns A random verifier `length` characters long
 */
async function generateVerifier(length) {
    return await random(length);
}
/** Generate a PKCE code challenge from a code verifier
 * @param code_verifier
 * @returns The base64 url encoded code challenge
 */
async function generateChallenge(code_verifier) {
    const buffer = await (await crypto).subtle.digest("SHA-256", new TextEncoder().encode(code_verifier));
    // Generate base64url string
    // btoa is deprecated in Node.js but is used here for web browser compatibility
    // (which has no good replacement yet, see also https://github.com/whatwg/html/issues/6811)
    return btoa(String.fromCharCode(...new Uint8Array(buffer)))
        .replace(/\//g, '_')
        .replace(/\+/g, '-')
        .replace(/=/g, '');
}
/** Generate a PKCE challenge pair
 * @param length Length of the verifer (between 43-128). Defaults to 43.
 * @returns PKCE challenge pair
 */
async function pkceChallenge(length) {
    if (!length)
        length = 43;
    if (length < 43 || length > 128) {
        throw `Expected a length between 43 and 128. Received ${length}.`;
    }
    const verifier = await generateVerifier(length);
    const challenge = await generateChallenge(verifier);
    return {
        code_verifier: verifier,
        code_challenge: challenge,
    };
}

/**
 * RFC 9728 OAuth Protected Resource Metadata
 */
const OAuthProtectedResourceMetadataSchema = objectType({
    resource: stringType().url(),
    authorization_servers: arrayType(stringType().url()).optional(),
    jwks_uri: stringType().url().optional(),
    scopes_supported: arrayType(stringType()).optional(),
    bearer_methods_supported: arrayType(stringType()).optional(),
    resource_signing_alg_values_supported: arrayType(stringType()).optional(),
    resource_name: stringType().optional(),
    resource_documentation: stringType().optional(),
    resource_policy_uri: stringType().url().optional(),
    resource_tos_uri: stringType().url().optional(),
    tls_client_certificate_bound_access_tokens: booleanType().optional(),
    authorization_details_types_supported: arrayType(stringType()).optional(),
    dpop_signing_alg_values_supported: arrayType(stringType()).optional(),
    dpop_bound_access_tokens_required: booleanType().optional(),
})
    .passthrough();
/**
 * RFC 8414 OAuth 2.0 Authorization Server Metadata
 */
const OAuthMetadataSchema = objectType({
    issuer: stringType(),
    authorization_endpoint: stringType(),
    token_endpoint: stringType(),
    registration_endpoint: stringType().optional(),
    scopes_supported: arrayType(stringType()).optional(),
    response_types_supported: arrayType(stringType()),
    response_modes_supported: arrayType(stringType()).optional(),
    grant_types_supported: arrayType(stringType()).optional(),
    token_endpoint_auth_methods_supported: arrayType(stringType()).optional(),
    token_endpoint_auth_signing_alg_values_supported: arrayType(stringType())
        .optional(),
    service_documentation: stringType().optional(),
    revocation_endpoint: stringType().optional(),
    revocation_endpoint_auth_methods_supported: arrayType(stringType()).optional(),
    revocation_endpoint_auth_signing_alg_values_supported: arrayType(stringType())
        .optional(),
    introspection_endpoint: stringType().optional(),
    introspection_endpoint_auth_methods_supported: arrayType(stringType())
        .optional(),
    introspection_endpoint_auth_signing_alg_values_supported: arrayType(stringType())
        .optional(),
    code_challenge_methods_supported: arrayType(stringType()).optional(),
})
    .passthrough();
/**
 * OAuth 2.1 token response
 */
const OAuthTokensSchema = objectType({
    access_token: stringType(),
    token_type: stringType(),
    expires_in: numberType().optional(),
    scope: stringType().optional(),
    refresh_token: stringType().optional(),
})
    .strip();
/**
 * OAuth 2.1 error response
 */
objectType({
    error: stringType(),
    error_description: stringType().optional(),
    error_uri: stringType().optional(),
});
/**
 * RFC 7591 OAuth 2.0 Dynamic Client Registration metadata
 */
const OAuthClientMetadataSchema = objectType({
    redirect_uris: arrayType(stringType()).refine((uris) => uris.every((uri) => URL.canParse(uri)), { message: "redirect_uris must contain valid URLs" }),
    token_endpoint_auth_method: stringType().optional(),
    grant_types: arrayType(stringType()).optional(),
    response_types: arrayType(stringType()).optional(),
    client_name: stringType().optional(),
    client_uri: stringType().optional(),
    logo_uri: stringType().optional(),
    scope: stringType().optional(),
    contacts: arrayType(stringType()).optional(),
    tos_uri: stringType().optional(),
    policy_uri: stringType().optional(),
    jwks_uri: stringType().optional(),
    jwks: anyType().optional(),
    software_id: stringType().optional(),
    software_version: stringType().optional(),
    software_statement: stringType().optional(),
}).strip();
/**
 * RFC 7591 OAuth 2.0 Dynamic Client Registration client information
 */
const OAuthClientInformationSchema = objectType({
    client_id: stringType(),
    client_secret: stringType().optional(),
    client_id_issued_at: numberType().optional(),
    client_secret_expires_at: numberType().optional(),
}).strip();
/**
 * RFC 7591 OAuth 2.0 Dynamic Client Registration full response (client information plus metadata)
 */
const OAuthClientInformationFullSchema = OAuthClientMetadataSchema.merge(OAuthClientInformationSchema);
/**
 * RFC 7591 OAuth 2.0 Dynamic Client Registration error response
 */
objectType({
    error: stringType(),
    error_description: stringType().optional(),
}).strip();
/**
 * RFC 7009 OAuth 2.0 Token Revocation request
 */
objectType({
    token: stringType(),
    token_type_hint: stringType().optional(),
}).strip();

/**
 * Utilities for handling OAuth resource URIs.
 */
/**
 * Converts a server URL to a resource URL by removing the fragment.
 * RFC 8707 section 2 states that resource URIs "MUST NOT include a fragment component".
 * Keeps everything else unchanged (scheme, domain, port, path, query).
 */
function resourceUrlFromServerUrl(url) {
    const resourceURL = typeof url === "string" ? new URL(url) : new URL(url.href);
    resourceURL.hash = ''; // Remove fragment
    return resourceURL;
}
/**
 * Checks if a requested resource URL matches a configured resource URL.
 * A requested resource matches if it has the same scheme, domain, port,
 * and its path starts with the configured resource's path.
 *
 * @param requestedResource The resource URL being requested
 * @param configuredResource The resource URL that has been configured
 * @returns true if the requested resource matches the configured resource, false otherwise
 */
function checkResourceAllowed({ requestedResource, configuredResource }) {
    const requested = typeof requestedResource === "string" ? new URL(requestedResource) : new URL(requestedResource.href);
    const configured = typeof configuredResource === "string" ? new URL(configuredResource) : new URL(configuredResource.href);
    // Compare the origin (scheme, domain, and port)
    if (requested.origin !== configured.origin) {
        return false;
    }
    // Handle cases like requested=/foo and configured=/foo/
    if (requested.pathname.length < configured.pathname.length) {
        return false;
    }
    // Check if the requested path starts with the configured path
    // Ensure both paths end with / for proper comparison
    // This ensures that if we have paths like "/api" and "/api/users",
    // we properly detect that "/api/users" is a subpath of "/api"
    // By adding a trailing slash if missing, we avoid false positives
    // where paths like "/api123" would incorrectly match "/api"
    const requestedPath = requested.pathname.endsWith('/') ? requested.pathname : requested.pathname + '/';
    const configuredPath = configured.pathname.endsWith('/') ? configured.pathname : configured.pathname + '/';
    return requestedPath.startsWith(configuredPath);
}

class UnauthorizedError extends Error {
    constructor(message) {
        super(message !== null && message !== void 0 ? message : "Unauthorized");
    }
}
/**
 * Determines the best client authentication method to use based on server support and client configuration.
 *
 * Priority order (highest to lowest):
 * 1. client_secret_basic (if client secret is available)
 * 2. client_secret_post (if client secret is available)
 * 3. none (for public clients)
 *
 * @param clientInformation - OAuth client information containing credentials
 * @param supportedMethods - Authentication methods supported by the authorization server
 * @returns The selected authentication method
 */
function selectClientAuthMethod(clientInformation, supportedMethods) {
    const hasClientSecret = clientInformation.client_secret !== undefined;
    // If server doesn't specify supported methods, use RFC 6749 defaults
    if (supportedMethods.length === 0) {
        return hasClientSecret ? "client_secret_post" : "none";
    }
    // Try methods in priority order (most secure first)
    if (hasClientSecret && supportedMethods.includes("client_secret_basic")) {
        return "client_secret_basic";
    }
    if (hasClientSecret && supportedMethods.includes("client_secret_post")) {
        return "client_secret_post";
    }
    if (supportedMethods.includes("none")) {
        return "none";
    }
    // Fallback: use what we have
    return hasClientSecret ? "client_secret_post" : "none";
}
/**
 * Applies client authentication to the request based on the specified method.
 *
 * Implements OAuth 2.1 client authentication methods:
 * - client_secret_basic: HTTP Basic authentication (RFC 6749 Section 2.3.1)
 * - client_secret_post: Credentials in request body (RFC 6749 Section 2.3.1)
 * - none: Public client authentication (RFC 6749 Section 2.1)
 *
 * @param method - The authentication method to use
 * @param clientInformation - OAuth client information containing credentials
 * @param headers - HTTP headers object to modify
 * @param params - URL search parameters to modify
 * @throws {Error} When required credentials are missing
 */
function applyClientAuthentication(method, clientInformation, headers, params) {
    const { client_id, client_secret } = clientInformation;
    switch (method) {
        case "client_secret_basic":
            applyBasicAuth(client_id, client_secret, headers);
            return;
        case "client_secret_post":
            applyPostAuth(client_id, client_secret, params);
            return;
        case "none":
            applyPublicAuth(client_id, params);
            return;
        default:
            throw new Error(`Unsupported client authentication method: ${method}`);
    }
}
/**
 * Applies HTTP Basic authentication (RFC 6749 Section 2.3.1)
 */
function applyBasicAuth(clientId, clientSecret, headers) {
    if (!clientSecret) {
        throw new Error("client_secret_basic authentication requires a client_secret");
    }
    const credentials = btoa(`${clientId}:${clientSecret}`);
    headers.set("Authorization", `Basic ${credentials}`);
}
/**
 * Applies POST body authentication (RFC 6749 Section 2.3.1)
 */
function applyPostAuth(clientId, clientSecret, params) {
    params.set("client_id", clientId);
    if (clientSecret) {
        params.set("client_secret", clientSecret);
    }
}
/**
 * Applies public client authentication (RFC 6749 Section 2.1)
 */
function applyPublicAuth(clientId, params) {
    params.set("client_id", clientId);
}
/**
 * Orchestrates the full auth flow with a server.
 *
 * This can be used as a single entry point for all authorization functionality,
 * instead of linking together the other lower-level functions in this module.
 */
async function auth(provider, { serverUrl, authorizationCode, scope, resourceMetadataUrl }) {
    let resourceMetadata;
    let authorizationServerUrl = serverUrl;
    try {
        resourceMetadata = await discoverOAuthProtectedResourceMetadata(serverUrl, { resourceMetadataUrl });
        if (resourceMetadata.authorization_servers && resourceMetadata.authorization_servers.length > 0) {
            authorizationServerUrl = resourceMetadata.authorization_servers[0];
        }
    }
    catch (_a) {
        // Ignore errors and fall back to /.well-known/oauth-authorization-server
    }
    const resource = await selectResourceURL(serverUrl, provider, resourceMetadata);
    const metadata = await discoverOAuthMetadata(serverUrl, {
        authorizationServerUrl
    });
    // Handle client registration if needed
    let clientInformation = await Promise.resolve(provider.clientInformation());
    if (!clientInformation) {
        if (authorizationCode !== undefined) {
            throw new Error("Existing OAuth client information is required when exchanging an authorization code");
        }
        if (!provider.saveClientInformation) {
            throw new Error("OAuth client information must be saveable for dynamic registration");
        }
        const fullInformation = await registerClient(authorizationServerUrl, {
            metadata,
            clientMetadata: provider.clientMetadata,
        });
        await provider.saveClientInformation(fullInformation);
        clientInformation = fullInformation;
    }
    // Exchange authorization code for tokens
    if (authorizationCode !== undefined) {
        const codeVerifier = await provider.codeVerifier();
        const tokens = await exchangeAuthorization(authorizationServerUrl, {
            metadata,
            clientInformation,
            authorizationCode,
            codeVerifier,
            redirectUri: provider.redirectUrl,
            resource,
            addClientAuthentication: provider.addClientAuthentication,
        });
        await provider.saveTokens(tokens);
        return "AUTHORIZED";
    }
    const tokens = await provider.tokens();
    // Handle token refresh or new authorization
    if (tokens === null || tokens === void 0 ? void 0 : tokens.refresh_token) {
        try {
            // Attempt to refresh the token
            const newTokens = await refreshAuthorization(authorizationServerUrl, {
                metadata,
                clientInformation,
                refreshToken: tokens.refresh_token,
                resource,
                addClientAuthentication: provider.addClientAuthentication,
            });
            await provider.saveTokens(newTokens);
            return "AUTHORIZED";
        }
        catch (_b) {
            // Could not refresh OAuth tokens
        }
    }
    const state = provider.state ? await provider.state() : undefined;
    // Start new authorization flow
    const { authorizationUrl, codeVerifier } = await startAuthorization(authorizationServerUrl, {
        metadata,
        clientInformation,
        state,
        redirectUrl: provider.redirectUrl,
        scope: scope || provider.clientMetadata.scope,
        resource,
    });
    await provider.saveCodeVerifier(codeVerifier);
    await provider.redirectToAuthorization(authorizationUrl);
    return "REDIRECT";
}
async function selectResourceURL(serverUrl, provider, resourceMetadata) {
    const defaultResource = resourceUrlFromServerUrl(serverUrl);
    // If provider has custom validation, delegate to it
    if (provider.validateResourceURL) {
        return await provider.validateResourceURL(defaultResource, resourceMetadata === null || resourceMetadata === void 0 ? void 0 : resourceMetadata.resource);
    }
    // Only include resource parameter when Protected Resource Metadata is present
    if (!resourceMetadata) {
        return undefined;
    }
    // Validate that the metadata's resource is compatible with our request
    if (!checkResourceAllowed({ requestedResource: defaultResource, configuredResource: resourceMetadata.resource })) {
        throw new Error(`Protected resource ${resourceMetadata.resource} does not match expected ${defaultResource} (or origin)`);
    }
    // Prefer the resource from metadata since it's what the server is telling us to request
    return new URL(resourceMetadata.resource);
}
/**
 * Extract resource_metadata from response header.
 */
function extractResourceMetadataUrl(res) {
    const authenticateHeader = res.headers.get("WWW-Authenticate");
    if (!authenticateHeader) {
        return undefined;
    }
    const [type, scheme] = authenticateHeader.split(' ');
    if (type.toLowerCase() !== 'bearer' || !scheme) {
        return undefined;
    }
    const regex = /resource_metadata="([^"]*)"/;
    const match = regex.exec(authenticateHeader);
    if (!match) {
        return undefined;
    }
    try {
        return new URL(match[1]);
    }
    catch (_a) {
        return undefined;
    }
}
/**
 * Looks up RFC 9728 OAuth 2.0 Protected Resource Metadata.
 *
 * If the server returns a 404 for the well-known endpoint, this function will
 * return `undefined`. Any other errors will be thrown as exceptions.
 */
async function discoverOAuthProtectedResourceMetadata(serverUrl, opts) {
    const response = await discoverMetadataWithFallback(serverUrl, 'oauth-protected-resource', {
        protocolVersion: opts === null || opts === void 0 ? void 0 : opts.protocolVersion,
        metadataUrl: opts === null || opts === void 0 ? void 0 : opts.resourceMetadataUrl,
    });
    if (!response || response.status === 404) {
        throw new Error(`Resource server does not implement OAuth 2.0 Protected Resource Metadata.`);
    }
    if (!response.ok) {
        throw new Error(`HTTP ${response.status} trying to load well-known OAuth protected resource metadata.`);
    }
    return OAuthProtectedResourceMetadataSchema.parse(await response.json());
}
/**
 * Helper function to handle fetch with CORS retry logic
 */
async function fetchWithCorsRetry(url, headers) {
    try {
        return await fetch(url, { headers });
    }
    catch (error) {
        if (error instanceof TypeError) {
            if (headers) {
                // CORS errors come back as TypeError, retry without headers
                return fetchWithCorsRetry(url);
            }
            else {
                // We're getting CORS errors on retry too, return undefined
                return undefined;
            }
        }
        throw error;
    }
}
/**
 * Constructs the well-known path for OAuth metadata discovery
 */
function buildWellKnownPath(wellKnownPrefix, pathname) {
    let wellKnownPath = `/.well-known/${wellKnownPrefix}${pathname}`;
    if (pathname.endsWith('/')) {
        // Strip trailing slash from pathname to avoid double slashes
        wellKnownPath = wellKnownPath.slice(0, -1);
    }
    return wellKnownPath;
}
/**
 * Tries to discover OAuth metadata at a specific URL
 */
async function tryMetadataDiscovery(url, protocolVersion) {
    const headers = {
        "MCP-Protocol-Version": protocolVersion
    };
    return await fetchWithCorsRetry(url, headers);
}
/**
 * Determines if fallback to root discovery should be attempted
 */
function shouldAttemptFallback(response, pathname) {
    return !response || response.status === 404 && pathname !== '/';
}
/**
 * Generic function for discovering OAuth metadata with fallback support
 */
async function discoverMetadataWithFallback(serverUrl, wellKnownType, opts) {
    var _a, _b;
    const issuer = new URL(serverUrl);
    const protocolVersion = (_a = opts === null || opts === void 0 ? void 0 : opts.protocolVersion) !== null && _a !== void 0 ? _a : LATEST_PROTOCOL_VERSION;
    let url;
    if (opts === null || opts === void 0 ? void 0 : opts.metadataUrl) {
        url = new URL(opts.metadataUrl);
    }
    else {
        // Try path-aware discovery first
        const wellKnownPath = buildWellKnownPath(wellKnownType, issuer.pathname);
        url = new URL(wellKnownPath, (_b = opts === null || opts === void 0 ? void 0 : opts.metadataServerUrl) !== null && _b !== void 0 ? _b : issuer);
        url.search = issuer.search;
    }
    let response = await tryMetadataDiscovery(url, protocolVersion);
    // If path-aware discovery fails with 404 and we're not already at root, try fallback to root discovery
    if (!(opts === null || opts === void 0 ? void 0 : opts.metadataUrl) && shouldAttemptFallback(response, issuer.pathname)) {
        const rootUrl = new URL(`/.well-known/${wellKnownType}`, issuer);
        response = await tryMetadataDiscovery(rootUrl, protocolVersion);
    }
    return response;
}
/**
 * Looks up RFC 8414 OAuth 2.0 Authorization Server Metadata.
 *
 * If the server returns a 404 for the well-known endpoint, this function will
 * return `undefined`. Any other errors will be thrown as exceptions.
 */
async function discoverOAuthMetadata(issuer, { authorizationServerUrl, protocolVersion, } = {}) {
    if (typeof issuer === 'string') {
        issuer = new URL(issuer);
    }
    if (!authorizationServerUrl) {
        authorizationServerUrl = issuer;
    }
    if (typeof authorizationServerUrl === 'string') {
        authorizationServerUrl = new URL(authorizationServerUrl);
    }
    protocolVersion !== null && protocolVersion !== void 0 ? protocolVersion : (protocolVersion = LATEST_PROTOCOL_VERSION);
    const response = await discoverMetadataWithFallback(issuer, 'oauth-authorization-server', {
        protocolVersion,
        metadataServerUrl: authorizationServerUrl,
    });
    if (!response || response.status === 404) {
        return undefined;
    }
    if (!response.ok) {
        throw new Error(`HTTP ${response.status} trying to load well-known OAuth metadata`);
    }
    return OAuthMetadataSchema.parse(await response.json());
}
/**
 * Begins the authorization flow with the given server, by generating a PKCE challenge and constructing the authorization URL.
 */
async function startAuthorization(authorizationServerUrl, { metadata, clientInformation, redirectUrl, scope, state, resource, }) {
    const responseType = "code";
    const codeChallengeMethod = "S256";
    let authorizationUrl;
    if (metadata) {
        authorizationUrl = new URL(metadata.authorization_endpoint);
        if (!metadata.response_types_supported.includes(responseType)) {
            throw new Error(`Incompatible auth server: does not support response type ${responseType}`);
        }
        if (!metadata.code_challenge_methods_supported ||
            !metadata.code_challenge_methods_supported.includes(codeChallengeMethod)) {
            throw new Error(`Incompatible auth server: does not support code challenge method ${codeChallengeMethod}`);
        }
    }
    else {
        authorizationUrl = new URL("/authorize", authorizationServerUrl);
    }
    // Generate PKCE challenge
    const challenge = await pkceChallenge();
    const codeVerifier = challenge.code_verifier;
    const codeChallenge = challenge.code_challenge;
    authorizationUrl.searchParams.set("response_type", responseType);
    authorizationUrl.searchParams.set("client_id", clientInformation.client_id);
    authorizationUrl.searchParams.set("code_challenge", codeChallenge);
    authorizationUrl.searchParams.set("code_challenge_method", codeChallengeMethod);
    authorizationUrl.searchParams.set("redirect_uri", String(redirectUrl));
    if (state) {
        authorizationUrl.searchParams.set("state", state);
    }
    if (scope) {
        authorizationUrl.searchParams.set("scope", scope);
    }
    if (resource) {
        authorizationUrl.searchParams.set("resource", resource.href);
    }
    return { authorizationUrl, codeVerifier };
}
/**
 * Exchanges an authorization code for an access token with the given server.
 *
 * Supports multiple client authentication methods as specified in OAuth 2.1:
 * - Automatically selects the best authentication method based on server support
 * - Falls back to appropriate defaults when server metadata is unavailable
 *
 * @param authorizationServerUrl - The authorization server's base URL
 * @param options - Configuration object containing client info, auth code, etc.
 * @returns Promise resolving to OAuth tokens
 * @throws {Error} When token exchange fails or authentication is invalid
 */
async function exchangeAuthorization(authorizationServerUrl, { metadata, clientInformation, authorizationCode, codeVerifier, redirectUri, resource, addClientAuthentication }) {
    var _a;
    const grantType = "authorization_code";
    const tokenUrl = (metadata === null || metadata === void 0 ? void 0 : metadata.token_endpoint)
        ? new URL(metadata.token_endpoint)
        : new URL("/token", authorizationServerUrl);
    if ((metadata === null || metadata === void 0 ? void 0 : metadata.grant_types_supported) &&
        !metadata.grant_types_supported.includes(grantType)) {
        throw new Error(`Incompatible auth server: does not support grant type ${grantType}`);
    }
    // Exchange code for tokens
    const headers = new Headers({
        "Content-Type": "application/x-www-form-urlencoded",
    });
    const params = new URLSearchParams({
        grant_type: grantType,
        code: authorizationCode,
        code_verifier: codeVerifier,
        redirect_uri: String(redirectUri),
    });
    if (addClientAuthentication) {
        addClientAuthentication(headers, params, authorizationServerUrl, metadata);
    }
    else {
        // Determine and apply client authentication method
        const supportedMethods = (_a = metadata === null || metadata === void 0 ? void 0 : metadata.token_endpoint_auth_methods_supported) !== null && _a !== void 0 ? _a : [];
        const authMethod = selectClientAuthMethod(clientInformation, supportedMethods);
        applyClientAuthentication(authMethod, clientInformation, headers, params);
    }
    if (resource) {
        params.set("resource", resource.href);
    }
    const response = await fetch(tokenUrl, {
        method: "POST",
        headers,
        body: params,
    });
    if (!response.ok) {
        throw new Error(`Token exchange failed: HTTP ${response.status}`);
    }
    return OAuthTokensSchema.parse(await response.json());
}
/**
 * Exchange a refresh token for an updated access token.
 *
 * Supports multiple client authentication methods as specified in OAuth 2.1:
 * - Automatically selects the best authentication method based on server support
 * - Preserves the original refresh token if a new one is not returned
 *
 * @param authorizationServerUrl - The authorization server's base URL
 * @param options - Configuration object containing client info, refresh token, etc.
 * @returns Promise resolving to OAuth tokens (preserves original refresh_token if not replaced)
 * @throws {Error} When token refresh fails or authentication is invalid
 */
async function refreshAuthorization(authorizationServerUrl, { metadata, clientInformation, refreshToken, resource, addClientAuthentication, }) {
    var _a;
    const grantType = "refresh_token";
    let tokenUrl;
    if (metadata) {
        tokenUrl = new URL(metadata.token_endpoint);
        if (metadata.grant_types_supported &&
            !metadata.grant_types_supported.includes(grantType)) {
            throw new Error(`Incompatible auth server: does not support grant type ${grantType}`);
        }
    }
    else {
        tokenUrl = new URL("/token", authorizationServerUrl);
    }
    // Exchange refresh token
    const headers = new Headers({
        "Content-Type": "application/x-www-form-urlencoded",
    });
    const params = new URLSearchParams({
        grant_type: grantType,
        refresh_token: refreshToken,
    });
    if (addClientAuthentication) {
        addClientAuthentication(headers, params, authorizationServerUrl, metadata);
    }
    else {
        // Determine and apply client authentication method
        const supportedMethods = (_a = metadata === null || metadata === void 0 ? void 0 : metadata.token_endpoint_auth_methods_supported) !== null && _a !== void 0 ? _a : [];
        const authMethod = selectClientAuthMethod(clientInformation, supportedMethods);
        applyClientAuthentication(authMethod, clientInformation, headers, params);
    }
    if (resource) {
        params.set("resource", resource.href);
    }
    const response = await fetch(tokenUrl, {
        method: "POST",
        headers,
        body: params,
    });
    if (!response.ok) {
        throw new Error(`Token refresh failed: HTTP ${response.status}`);
    }
    return OAuthTokensSchema.parse({ refresh_token: refreshToken, ...(await response.json()) });
}
/**
 * Performs OAuth 2.0 Dynamic Client Registration according to RFC 7591.
 */
async function registerClient(authorizationServerUrl, { metadata, clientMetadata, }) {
    let registrationUrl;
    if (metadata) {
        if (!metadata.registration_endpoint) {
            throw new Error("Incompatible auth server: does not support dynamic client registration");
        }
        registrationUrl = new URL(metadata.registration_endpoint);
    }
    else {
        registrationUrl = new URL("/register", authorizationServerUrl);
    }
    const response = await fetch(registrationUrl, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(clientMetadata),
    });
    if (!response.ok) {
        throw new Error(`Dynamic client registration failed: HTTP ${response.status}`);
    }
    return OAuthClientInformationFullSchema.parse(await response.json());
}

class ParseError extends Error {
  constructor(message, options) {
    super(message), this.name = "ParseError", this.type = options.type, this.field = options.field, this.value = options.value, this.line = options.line;
  }
}
function noop(_arg) {
}
function createParser(callbacks) {
  if (typeof callbacks == "function")
    throw new TypeError(
      "`callbacks` must be an object, got a function instead. Did you mean `{onEvent: fn}`?"
    );
  const { onEvent = noop, onError = noop, onRetry = noop, onComment } = callbacks;
  let incompleteLine = "", isFirstChunk = true, id, data = "", eventType = "";
  function feed(newChunk) {
    const chunk = isFirstChunk ? newChunk.replace(/^\xEF\xBB\xBF/, "") : newChunk, [complete, incomplete] = splitLines(`${incompleteLine}${chunk}`);
    for (const line of complete)
      parseLine(line);
    incompleteLine = incomplete, isFirstChunk = false;
  }
  function parseLine(line) {
    if (line === "") {
      dispatchEvent();
      return;
    }
    if (line.startsWith(":")) {
      onComment && onComment(line.slice(line.startsWith(": ") ? 2 : 1));
      return;
    }
    const fieldSeparatorIndex = line.indexOf(":");
    if (fieldSeparatorIndex !== -1) {
      const field = line.slice(0, fieldSeparatorIndex), offset = line[fieldSeparatorIndex + 1] === " " ? 2 : 1, value = line.slice(fieldSeparatorIndex + offset);
      processField(field, value, line);
      return;
    }
    processField(line, "", line);
  }
  function processField(field, value, line) {
    switch (field) {
      case "event":
        eventType = value;
        break;
      case "data":
        data = `${data}${value}
`;
        break;
      case "id":
        id = value.includes("\0") ? void 0 : value;
        break;
      case "retry":
        /^\d+$/.test(value) ? onRetry(parseInt(value, 10)) : onError(
          new ParseError(`Invalid \`retry\` value: "${value}"`, {
            type: "invalid-retry",
            value,
            line
          })
        );
        break;
      default:
        onError(
          new ParseError(
            `Unknown field "${field.length > 20 ? `${field.slice(0, 20)}\u2026` : field}"`,
            { type: "unknown-field", field, value, line }
          )
        );
        break;
    }
  }
  function dispatchEvent() {
    data.length > 0 && onEvent({
      id,
      event: eventType || void 0,
      // If the data buffer's last character is a U+000A LINE FEED (LF) character,
      // then remove the last character from the data buffer.
      data: data.endsWith(`
`) ? data.slice(0, -1) : data
    }), id = void 0, data = "", eventType = "";
  }
  function reset(options = {}) {
    incompleteLine && options.consume && parseLine(incompleteLine), isFirstChunk = true, id = void 0, data = "", eventType = "", incompleteLine = "";
  }
  return { feed, reset };
}
function splitLines(chunk) {
  const lines = [];
  let incompleteLine = "", searchIndex = 0;
  for (; searchIndex < chunk.length; ) {
    const crIndex = chunk.indexOf("\r", searchIndex), lfIndex = chunk.indexOf(`
`, searchIndex);
    let lineEnd = -1;
    if (crIndex !== -1 && lfIndex !== -1 ? lineEnd = Math.min(crIndex, lfIndex) : crIndex !== -1 ? lineEnd = crIndex : lfIndex !== -1 && (lineEnd = lfIndex), lineEnd === -1) {
      incompleteLine = chunk.slice(searchIndex);
      break;
    } else {
      const line = chunk.slice(searchIndex, lineEnd);
      lines.push(line), searchIndex = lineEnd + 1, chunk[searchIndex - 1] === "\r" && chunk[searchIndex] === `
` && searchIndex++;
    }
  }
  return [lines, incompleteLine];
}

class EventSourceParserStream extends TransformStream {
  constructor({ onError, onRetry, onComment } = {}) {
    let parser;
    super({
      start(controller) {
        parser = createParser({
          onEvent: (event) => {
            controller.enqueue(event);
          },
          onError(error) {
            onError === "terminate" ? controller.error(error) : typeof onError == "function" && onError(error);
          },
          onRetry,
          onComment
        });
      },
      transform(chunk) {
        parser.feed(chunk);
      }
    });
  }
}

// Default reconnection options for StreamableHTTP connections
const DEFAULT_STREAMABLE_HTTP_RECONNECTION_OPTIONS = {
    initialReconnectionDelay: 1000,
    maxReconnectionDelay: 30000,
    reconnectionDelayGrowFactor: 1.5,
    maxRetries: 2,
};
class StreamableHTTPError extends Error {
    constructor(code, message) {
        super(`Streamable HTTP error: ${message}`);
        this.code = code;
    }
}
/**
 * Client transport for Streamable HTTP: this implements the MCP Streamable HTTP transport specification.
 * It will connect to a server using HTTP POST for sending messages and HTTP GET with Server-Sent Events
 * for receiving messages.
 */
class StreamableHTTPClientTransport {
    constructor(url, opts) {
        var _a;
        this._url = url;
        this._resourceMetadataUrl = undefined;
        this._requestInit = opts === null || opts === void 0 ? void 0 : opts.requestInit;
        this._authProvider = opts === null || opts === void 0 ? void 0 : opts.authProvider;
        this._fetch = opts === null || opts === void 0 ? void 0 : opts.fetch;
        this._sessionId = opts === null || opts === void 0 ? void 0 : opts.sessionId;
        this._reconnectionOptions = (_a = opts === null || opts === void 0 ? void 0 : opts.reconnectionOptions) !== null && _a !== void 0 ? _a : DEFAULT_STREAMABLE_HTTP_RECONNECTION_OPTIONS;
    }
    async _authThenStart() {
        var _a;
        if (!this._authProvider) {
            throw new UnauthorizedError("No auth provider");
        }
        let result;
        try {
            result = await auth(this._authProvider, { serverUrl: this._url, resourceMetadataUrl: this._resourceMetadataUrl });
        }
        catch (error) {
            (_a = this.onerror) === null || _a === void 0 ? void 0 : _a.call(this, error);
            throw error;
        }
        if (result !== "AUTHORIZED") {
            throw new UnauthorizedError();
        }
        return await this._startOrAuthSse({ resumptionToken: undefined });
    }
    async _commonHeaders() {
        var _a;
        const headers = {};
        if (this._authProvider) {
            const tokens = await this._authProvider.tokens();
            if (tokens) {
                headers["Authorization"] = `Bearer ${tokens.access_token}`;
            }
        }
        if (this._sessionId) {
            headers["mcp-session-id"] = this._sessionId;
        }
        if (this._protocolVersion) {
            headers["mcp-protocol-version"] = this._protocolVersion;
        }
        const extraHeaders = this._normalizeHeaders((_a = this._requestInit) === null || _a === void 0 ? void 0 : _a.headers);
        return new Headers({
            ...headers,
            ...extraHeaders,
        });
    }
    async _startOrAuthSse(options) {
        var _a, _b, _c;
        const { resumptionToken } = options;
        try {
            // Try to open an initial SSE stream with GET to listen for server messages
            // This is optional according to the spec - server may not support it
            const headers = await this._commonHeaders();
            headers.set("Accept", "text/event-stream");
            // Include Last-Event-ID header for resumable streams if provided
            if (resumptionToken) {
                headers.set("last-event-id", resumptionToken);
            }
            const response = await ((_a = this._fetch) !== null && _a !== void 0 ? _a : fetch)(this._url, {
                method: "GET",
                headers,
                signal: (_b = this._abortController) === null || _b === void 0 ? void 0 : _b.signal,
            });
            if (!response.ok) {
                if (response.status === 401 && this._authProvider) {
                    // Need to authenticate
                    return await this._authThenStart();
                }
                // 405 indicates that the server does not offer an SSE stream at GET endpoint
                // This is an expected case that should not trigger an error
                if (response.status === 405) {
                    return;
                }
                throw new StreamableHTTPError(response.status, `Failed to open SSE stream: ${response.statusText}`);
            }
            this._handleSseStream(response.body, options);
        }
        catch (error) {
            (_c = this.onerror) === null || _c === void 0 ? void 0 : _c.call(this, error);
            throw error;
        }
    }
    /**
     * Calculates the next reconnection delay using  backoff algorithm
     *
     * @param attempt Current reconnection attempt count for the specific stream
     * @returns Time to wait in milliseconds before next reconnection attempt
     */
    _getNextReconnectionDelay(attempt) {
        // Access default values directly, ensuring they're never undefined
        const initialDelay = this._reconnectionOptions.initialReconnectionDelay;
        const growFactor = this._reconnectionOptions.reconnectionDelayGrowFactor;
        const maxDelay = this._reconnectionOptions.maxReconnectionDelay;
        // Cap at maximum delay
        return Math.min(initialDelay * Math.pow(growFactor, attempt), maxDelay);
    }
    _normalizeHeaders(headers) {
        if (!headers)
            return {};
        if (headers instanceof Headers) {
            return Object.fromEntries(headers.entries());
        }
        if (Array.isArray(headers)) {
            return Object.fromEntries(headers);
        }
        return { ...headers };
    }
    /**
     * Schedule a reconnection attempt with exponential backoff
     *
     * @param lastEventId The ID of the last received event for resumability
     * @param attemptCount Current reconnection attempt count for this specific stream
     */
    _scheduleReconnection(options, attemptCount = 0) {
        var _a;
        // Use provided options or default options
        const maxRetries = this._reconnectionOptions.maxRetries;
        // Check if we've exceeded maximum retry attempts
        if (maxRetries > 0 && attemptCount >= maxRetries) {
            (_a = this.onerror) === null || _a === void 0 ? void 0 : _a.call(this, new Error(`Maximum reconnection attempts (${maxRetries}) exceeded.`));
            return;
        }
        // Calculate next delay based on current attempt count
        const delay = this._getNextReconnectionDelay(attemptCount);
        // Schedule the reconnection
        setTimeout(() => {
            // Use the last event ID to resume where we left off
            this._startOrAuthSse(options).catch(error => {
                var _a;
                (_a = this.onerror) === null || _a === void 0 ? void 0 : _a.call(this, new Error(`Failed to reconnect SSE stream: ${error instanceof Error ? error.message : String(error)}`));
                // Schedule another attempt if this one failed, incrementing the attempt counter
                this._scheduleReconnection(options, attemptCount + 1);
            });
        }, delay);
    }
    _handleSseStream(stream, options) {
        if (!stream) {
            return;
        }
        const { onresumptiontoken, replayMessageId } = options;
        let lastEventId;
        const processStream = async () => {
            var _a, _b, _c, _d;
            // this is the closest we can get to trying to catch network errors
            // if something happens reader will throw
            try {
                // Create a pipeline: binary stream -> text decoder -> SSE parser
                const reader = stream
                    .pipeThrough(new TextDecoderStream())
                    .pipeThrough(new EventSourceParserStream())
                    .getReader();
                while (true) {
                    const { value: event, done } = await reader.read();
                    if (done) {
                        break;
                    }
                    // Update last event ID if provided
                    if (event.id) {
                        lastEventId = event.id;
                        onresumptiontoken === null || onresumptiontoken === void 0 ? void 0 : onresumptiontoken(event.id);
                    }
                    if (!event.event || event.event === "message") {
                        try {
                            const message = JSONRPCMessageSchema.parse(JSON.parse(event.data));
                            if (replayMessageId !== undefined && isJSONRPCResponse(message)) {
                                message.id = replayMessageId;
                            }
                            (_a = this.onmessage) === null || _a === void 0 ? void 0 : _a.call(this, message);
                        }
                        catch (error) {
                            (_b = this.onerror) === null || _b === void 0 ? void 0 : _b.call(this, error);
                        }
                    }
                }
            }
            catch (error) {
                // Handle stream errors - likely a network disconnect
                (_c = this.onerror) === null || _c === void 0 ? void 0 : _c.call(this, new Error(`SSE stream disconnected: ${error}`));
                // Attempt to reconnect if the stream disconnects unexpectedly and we aren't closing
                if (this._abortController && !this._abortController.signal.aborted) {
                    // Use the exponential backoff reconnection strategy
                    if (lastEventId !== undefined) {
                        try {
                            this._scheduleReconnection({
                                resumptionToken: lastEventId,
                                onresumptiontoken,
                                replayMessageId
                            }, 0);
                        }
                        catch (error) {
                            (_d = this.onerror) === null || _d === void 0 ? void 0 : _d.call(this, new Error(`Failed to reconnect: ${error instanceof Error ? error.message : String(error)}`));
                        }
                    }
                }
            }
        };
        processStream();
    }
    async start() {
        if (this._abortController) {
            throw new Error("StreamableHTTPClientTransport already started! If using Client class, note that connect() calls start() automatically.");
        }
        this._abortController = new AbortController();
    }
    /**
     * Call this method after the user has finished authorizing via their user agent and is redirected back to the MCP client application. This will exchange the authorization code for an access token, enabling the next connection attempt to successfully auth.
     */
    async finishAuth(authorizationCode) {
        if (!this._authProvider) {
            throw new UnauthorizedError("No auth provider");
        }
        const result = await auth(this._authProvider, { serverUrl: this._url, authorizationCode, resourceMetadataUrl: this._resourceMetadataUrl });
        if (result !== "AUTHORIZED") {
            throw new UnauthorizedError("Failed to authorize");
        }
    }
    async close() {
        var _a, _b;
        // Abort any pending requests
        (_a = this._abortController) === null || _a === void 0 ? void 0 : _a.abort();
        (_b = this.onclose) === null || _b === void 0 ? void 0 : _b.call(this);
    }
    async send(message, options) {
        var _a, _b, _c, _d;
        try {
            const { resumptionToken, onresumptiontoken } = options || {};
            if (resumptionToken) {
                // If we have at last event ID, we need to reconnect the SSE stream
                this._startOrAuthSse({ resumptionToken, replayMessageId: isJSONRPCRequest(message) ? message.id : undefined }).catch(err => { var _a; return (_a = this.onerror) === null || _a === void 0 ? void 0 : _a.call(this, err); });
                return;
            }
            const headers = await this._commonHeaders();
            headers.set("content-type", "application/json");
            headers.set("accept", "application/json, text/event-stream");
            const init = {
                ...this._requestInit,
                method: "POST",
                headers,
                body: JSON.stringify(message),
                signal: (_a = this._abortController) === null || _a === void 0 ? void 0 : _a.signal,
            };
            const response = await ((_b = this._fetch) !== null && _b !== void 0 ? _b : fetch)(this._url, init);
            // Handle session ID received during initialization
            const sessionId = response.headers.get("mcp-session-id");
            if (sessionId) {
                this._sessionId = sessionId;
            }
            if (!response.ok) {
                if (response.status === 401 && this._authProvider) {
                    this._resourceMetadataUrl = extractResourceMetadataUrl(response);
                    const result = await auth(this._authProvider, { serverUrl: this._url, resourceMetadataUrl: this._resourceMetadataUrl });
                    if (result !== "AUTHORIZED") {
                        throw new UnauthorizedError();
                    }
                    // Purposely _not_ awaited, so we don't call onerror twice
                    return this.send(message);
                }
                const text = await response.text().catch(() => null);
                throw new Error(`Error POSTing to endpoint (HTTP ${response.status}): ${text}`);
            }
            // If the response is 202 Accepted, there's no body to process
            if (response.status === 202) {
                // if the accepted notification is initialized, we start the SSE stream
                // if it's supported by the server
                if (isInitializedNotification(message)) {
                    // Start without a lastEventId since this is a fresh connection
                    this._startOrAuthSse({ resumptionToken: undefined }).catch(err => { var _a; return (_a = this.onerror) === null || _a === void 0 ? void 0 : _a.call(this, err); });
                }
                return;
            }
            // Get original message(s) for detecting request IDs
            const messages = Array.isArray(message) ? message : [message];
            const hasRequests = messages.filter(msg => "method" in msg && "id" in msg && msg.id !== undefined).length > 0;
            // Check the response type
            const contentType = response.headers.get("content-type");
            if (hasRequests) {
                if (contentType === null || contentType === void 0 ? void 0 : contentType.includes("text/event-stream")) {
                    // Handle SSE stream responses for requests
                    // We use the same handler as standalone streams, which now supports
                    // reconnection with the last event ID
                    this._handleSseStream(response.body, { onresumptiontoken });
                }
                else if (contentType === null || contentType === void 0 ? void 0 : contentType.includes("application/json")) {
                    // For non-streaming servers, we might get direct JSON responses
                    const data = await response.json();
                    const responseMessages = Array.isArray(data)
                        ? data.map(msg => JSONRPCMessageSchema.parse(msg))
                        : [JSONRPCMessageSchema.parse(data)];
                    for (const msg of responseMessages) {
                        (_c = this.onmessage) === null || _c === void 0 ? void 0 : _c.call(this, msg);
                    }
                }
                else {
                    throw new StreamableHTTPError(-1, `Unexpected content type: ${contentType}`);
                }
            }
        }
        catch (error) {
            (_d = this.onerror) === null || _d === void 0 ? void 0 : _d.call(this, error);
            throw error;
        }
    }
    get sessionId() {
        return this._sessionId;
    }
    /**
     * Terminates the current session by sending a DELETE request to the server.
     *
     * Clients that no longer need a particular session
     * (e.g., because the user is leaving the client application) SHOULD send an
     * HTTP DELETE to the MCP endpoint with the Mcp-Session-Id header to explicitly
     * terminate the session.
     *
     * The server MAY respond with HTTP 405 Method Not Allowed, indicating that
     * the server does not allow clients to terminate sessions.
     */
    async terminateSession() {
        var _a, _b, _c;
        if (!this._sessionId) {
            return; // No session to terminate
        }
        try {
            const headers = await this._commonHeaders();
            const init = {
                ...this._requestInit,
                method: "DELETE",
                headers,
                signal: (_a = this._abortController) === null || _a === void 0 ? void 0 : _a.signal,
            };
            const response = await ((_b = this._fetch) !== null && _b !== void 0 ? _b : fetch)(this._url, init);
            // We specifically handle 405 as a valid response according to the spec,
            // meaning the server does not support explicit session termination
            if (!response.ok && response.status !== 405) {
                throw new StreamableHTTPError(response.status, `Failed to terminate session: ${response.statusText}`);
            }
            this._sessionId = undefined;
        }
        catch (error) {
            (_c = this.onerror) === null || _c === void 0 ? void 0 : _c.call(this, error);
            throw error;
        }
    }
    setProtocolVersion(version) {
        this._protocolVersion = version;
    }
    get protocolVersion() {
        return this._protocolVersion;
    }
}

/**
 * Connect to the GitHub MCP server and retrieve available tools
 */
async function connectToGitHubMCP(token) {
    const githubMcpUrl = 'https://api.githubcopilot.com/mcp/';
    core.info('Connecting to GitHub MCP server...');
    const transport = new StreamableHTTPClientTransport(new URL(githubMcpUrl), {
        requestInit: {
            headers: {
                Authorization: `Bearer ${token}`,
                'X-MCP-Readonly': 'true'
            }
        }
    });
    const client = new Client({
        name: 'ai-inference-action',
        version: '1.0.0',
        transport
    });
    try {
        await client.connect(transport);
    }
    catch (mcpError) {
        core.warning(`Failed to connect to GitHub MCP server: ${mcpError}`);
        return null;
    }
    core.info('Successfully connected to GitHub MCP server');
    const toolsResponse = await client.listTools();
    core.info(`Retrieved ${toolsResponse.tools?.length || 0} tools from GitHub MCP server`);
    // Map GitHub MCP tools → Azure AI Inference tool definitions
    const tools = (toolsResponse.tools || []).map((t) => ({
        type: 'function',
        function: {
            name: t.name,
            description: t.description,
            parameters: t.inputSchema
        }
    }));
    core.info(`Mapped ${tools.length} GitHub MCP tools for Azure AI Inference`);
    return { client, tools };
}
/**
 * Execute a single tool call via GitHub MCP
 */
async function executeToolCall(githubMcpClient, toolCall) {
    core.info(`Executing GitHub MCP tool: ${toolCall.function.name} with args: ${toolCall.function.arguments}`);
    try {
        const args = JSON.parse(toolCall.function.arguments);
        const result = await githubMcpClient.callTool({
            name: toolCall.function.name,
            arguments: args
        });
        core.info(`GitHub MCP tool ${toolCall.function.name} executed successfully`);
        return {
            tool_call_id: toolCall.id,
            role: 'tool',
            name: toolCall.function.name,
            content: JSON.stringify(result.content)
        };
    }
    catch (toolError) {
        core.warning(`Failed to execute GitHub MCP tool ${toolCall.function.name}: ${toolError}`);
        return {
            tool_call_id: toolCall.id,
            role: 'tool',
            name: toolCall.function.name,
            content: `Error: ${toolError}`
        };
    }
}
/**
 * Execute all tool calls from a response via GitHub MCP
 */
async function executeToolCalls(githubMcpClient, toolCalls) {
    const toolResults = [];
    for (const toolCall of toolCalls) {
        const result = await executeToolCall(githubMcpClient, toolCall);
        toolResults.push(result);
    }
    return toolResults;
}

/******************************************************************************
Copyright (c) Microsoft Corporation.

Permission to use, copy, modify, and/or distribute this software for any
purpose with or without fee is hereby granted.

THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH
REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY
AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,
INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM
LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR
OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR
PERFORMANCE OF THIS SOFTWARE.
***************************************************************************** */
/* global Reflect, Promise, SuppressedError, Symbol, Iterator */


function __rest(s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
}

function __values(o) {
    var s = typeof Symbol === "function" && Symbol.iterator, m = s && o[s], i = 0;
    if (m) return m.call(o);
    if (o && typeof o.length === "number") return {
        next: function () {
            if (o && i >= o.length) o = void 0;
            return { value: o && o[i++], done: !o };
        }
    };
    throw new TypeError(s ? "Object is not iterable." : "Symbol.iterator is not defined.");
}

function __await(v) {
    return this instanceof __await ? (this.v = v, this) : new __await(v);
}

function __asyncGenerator(thisArg, _arguments, generator) {
    if (!Symbol.asyncIterator) throw new TypeError("Symbol.asyncIterator is not defined.");
    var g = generator.apply(thisArg, _arguments || []), i, q = [];
    return i = Object.create((typeof AsyncIterator === "function" ? AsyncIterator : Object).prototype), verb("next"), verb("throw"), verb("return", awaitReturn), i[Symbol.asyncIterator] = function () { return this; }, i;
    function awaitReturn(f) { return function (v) { return Promise.resolve(v).then(f, reject); }; }
    function verb(n, f) { if (g[n]) { i[n] = function (v) { return new Promise(function (a, b) { q.push([n, v, a, b]) > 1 || resume(n, v); }); }; if (f) i[n] = f(i[n]); } }
    function resume(n, v) { try { step(g[n](v)); } catch (e) { settle(q[0][3], e); } }
    function step(r) { r.value instanceof __await ? Promise.resolve(r.value.v).then(fulfill, reject) : settle(q[0][2], r); }
    function fulfill(value) { resume("next", value); }
    function reject(value) { resume("throw", value); }
    function settle(f, v) { if (f(v), q.shift(), q.length) resume(q[0][0], q[0][1]); }
}

function __asyncValues(o) {
    if (!Symbol.asyncIterator) throw new TypeError("Symbol.asyncIterator is not defined.");
    var m = o[Symbol.asyncIterator], i;
    return m ? m.call(o) : (o = typeof __values === "function" ? __values(o) : o[Symbol.iterator](), i = {}, verb("next"), verb("throw"), verb("return"), i[Symbol.asyncIterator] = function () { return this; }, i);
    function verb(n) { i[n] = o[n] && function (v) { return new Promise(function (resolve, reject) { v = o[n](v), settle(resolve, reject, v.done, v.value); }); }; }
    function settle(resolve, reject, d, v) { Promise.resolve(v).then(function(v) { resolve({ value: v, done: d }); }, reject); }
}

typeof SuppressedError === "function" ? SuppressedError : function (error, suppressed, message) {
    var e = new Error(message);
    return e.name = "SuppressedError", e.error = error, e.suppressed = suppressed, e;
};

// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.
/**
 * This error is thrown when an asynchronous operation has been aborted.
 * Check for this error by testing the `name` that the name property of the
 * error matches `"AbortError"`.
 *
 * @example
 * ```ts snippet:ReadmeSampleAbortError
 * import { AbortError } from "@typespec/ts-http-runtime";
 *
 * async function doAsyncWork(options: { abortSignal: AbortSignal }): Promise<void> {
 *   if (options.abortSignal.aborted) {
 *     throw new AbortError();
 *   }
 *
 *   // do async work
 * }
 *
 * const controller = new AbortController();
 * controller.abort();
 *
 * try {
 *   doAsyncWork({ abortSignal: controller.signal });
 * } catch (e) {
 *   if (e instanceof Error && e.name === "AbortError") {
 *     // handle abort error here.
 *   }
 * }
 * ```
 */
let AbortError$1 = class AbortError extends Error {
    constructor(message) {
        super(message);
        this.name = "AbortError";
    }
};

// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.
function log(message, ...args) {
    process$1.stderr.write(`${util$2.format(message, ...args)}${EOL}`);
}

// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.
const debugEnvVariable = (typeof process !== "undefined" && process.env && process.env.DEBUG) || undefined;
let enabledString;
let enabledNamespaces = [];
let skippedNamespaces = [];
const debuggers = [];
if (debugEnvVariable) {
    enable(debugEnvVariable);
}
const debugObj = Object.assign((namespace) => {
    return createDebugger(namespace);
}, {
    enable,
    enabled,
    disable,
    log,
});
function enable(namespaces) {
    enabledString = namespaces;
    enabledNamespaces = [];
    skippedNamespaces = [];
    const wildcard = /\*/g;
    const namespaceList = namespaces.split(",").map((ns) => ns.trim().replace(wildcard, ".*?"));
    for (const ns of namespaceList) {
        if (ns.startsWith("-")) {
            skippedNamespaces.push(new RegExp(`^${ns.substr(1)}$`));
        }
        else {
            enabledNamespaces.push(new RegExp(`^${ns}$`));
        }
    }
    for (const instance of debuggers) {
        instance.enabled = enabled(instance.namespace);
    }
}
function enabled(namespace) {
    if (namespace.endsWith("*")) {
        return true;
    }
    for (const skipped of skippedNamespaces) {
        if (skipped.test(namespace)) {
            return false;
        }
    }
    for (const enabledNamespace of enabledNamespaces) {
        if (enabledNamespace.test(namespace)) {
            return true;
        }
    }
    return false;
}
function disable() {
    const result = enabledString || "";
    enable("");
    return result;
}
function createDebugger(namespace) {
    const newDebugger = Object.assign(debug, {
        enabled: enabled(namespace),
        destroy,
        log: debugObj.log,
        namespace,
        extend,
    });
    function debug(...args) {
        if (!newDebugger.enabled) {
            return;
        }
        if (args.length > 0) {
            args[0] = `${namespace} ${args[0]}`;
        }
        newDebugger.log(...args);
    }
    debuggers.push(newDebugger);
    return newDebugger;
}
function destroy() {
    const index = debuggers.indexOf(this);
    if (index >= 0) {
        debuggers.splice(index, 1);
        return true;
    }
    return false;
}
function extend(namespace) {
    const newDebugger = createDebugger(`${this.namespace}:${namespace}`);
    newDebugger.log = this.log;
    return newDebugger;
}

// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.
const TYPESPEC_RUNTIME_LOG_LEVELS = ["verbose", "info", "warning", "error"];
const levelMap = {
    verbose: 400,
    info: 300,
    warning: 200,
    error: 100,
};
function patchLogMethod(parent, child) {
    child.log = (...args) => {
        parent.log(...args);
    };
}
function isTypeSpecRuntimeLogLevel(level) {
    return TYPESPEC_RUNTIME_LOG_LEVELS.includes(level);
}
/**
 * Creates a logger context base on the provided options.
 * @param options - The options for creating a logger context.
 * @returns The logger context.
 */
function createLoggerContext(options) {
    const registeredLoggers = new Set();
    const logLevelFromEnv = (typeof process !== "undefined" && process.env && process.env[options.logLevelEnvVarName]) ||
        undefined;
    let logLevel;
    const clientLogger = debugObj(options.namespace);
    clientLogger.log = (...args) => {
        debugObj.log(...args);
    };
    if (logLevelFromEnv) {
        // avoid calling setLogLevel because we don't want a mis-set environment variable to crash
        if (isTypeSpecRuntimeLogLevel(logLevelFromEnv)) {
            setLogLevel(logLevelFromEnv);
        }
        else {
            console.error(`${options.logLevelEnvVarName} set to unknown log level '${logLevelFromEnv}'; logging is not enabled. Acceptable values: ${TYPESPEC_RUNTIME_LOG_LEVELS.join(", ")}.`);
        }
    }
    function shouldEnable(logger) {
        return Boolean(logLevel && levelMap[logger.level] <= levelMap[logLevel]);
    }
    function createLogger(parent, level) {
        const logger = Object.assign(parent.extend(level), {
            level,
        });
        patchLogMethod(parent, logger);
        if (shouldEnable(logger)) {
            const enabledNamespaces = debugObj.disable();
            debugObj.enable(enabledNamespaces + "," + logger.namespace);
        }
        registeredLoggers.add(logger);
        return logger;
    }
    return {
        setLogLevel(level) {
            if (level && !isTypeSpecRuntimeLogLevel(level)) {
                throw new Error(`Unknown log level '${level}'. Acceptable values: ${TYPESPEC_RUNTIME_LOG_LEVELS.join(",")}`);
            }
            logLevel = level;
            const enabledNamespaces = [];
            for (const logger of registeredLoggers) {
                if (shouldEnable(logger)) {
                    enabledNamespaces.push(logger.namespace);
                }
            }
            debugObj.enable(enabledNamespaces.join(","));
        },
        getLogLevel() {
            return logLevel;
        },
        createClientLogger(namespace) {
            const clientRootLogger = clientLogger.extend(namespace);
            patchLogMethod(clientLogger, clientRootLogger);
            return {
                error: createLogger(clientRootLogger, "error"),
                warning: createLogger(clientRootLogger, "warning"),
                info: createLogger(clientRootLogger, "info"),
                verbose: createLogger(clientRootLogger, "verbose"),
            };
        },
        logger: clientLogger,
    };
}
const context$1 = createLoggerContext({
    logLevelEnvVarName: "TYPESPEC_RUNTIME_LOG_LEVEL",
    namespace: "typeSpecRuntime",
});
/**
 * Retrieves the currently specified log level.
 */
function setLogLevel(logLevel) {
    context$1.setLogLevel(logLevel);
}
/**
 * Creates a logger for use by the SDKs that inherits from `TypeSpecRuntimeLogger`.
 * @param namespace - The name of the SDK package.
 * @hidden
 */
function createClientLogger$1(namespace) {
    return context$1.createClientLogger(namespace);
}

// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.
function normalizeName(name) {
    return name.toLowerCase();
}
function* headerIterator(map) {
    for (const entry of map.values()) {
        yield [entry.name, entry.value];
    }
}
class HttpHeadersImpl {
    constructor(rawHeaders) {
        this._headersMap = new Map();
        if (rawHeaders) {
            for (const headerName of Object.keys(rawHeaders)) {
                this.set(headerName, rawHeaders[headerName]);
            }
        }
    }
    /**
     * Set a header in this collection with the provided name and value. The name is
     * case-insensitive.
     * @param name - The name of the header to set. This value is case-insensitive.
     * @param value - The value of the header to set.
     */
    set(name, value) {
        this._headersMap.set(normalizeName(name), { name, value: String(value).trim() });
    }
    /**
     * Get the header value for the provided header name, or undefined if no header exists in this
     * collection with the provided name.
     * @param name - The name of the header. This value is case-insensitive.
     */
    get(name) {
        var _a;
        return (_a = this._headersMap.get(normalizeName(name))) === null || _a === void 0 ? void 0 : _a.value;
    }
    /**
     * Get whether or not this header collection contains a header entry for the provided header name.
     * @param name - The name of the header to set. This value is case-insensitive.
     */
    has(name) {
        return this._headersMap.has(normalizeName(name));
    }
    /**
     * Remove the header with the provided headerName.
     * @param name - The name of the header to remove.
     */
    delete(name) {
        this._headersMap.delete(normalizeName(name));
    }
    /**
     * Get the JSON object representation of this HTTP header collection.
     */
    toJSON(options = {}) {
        const result = {};
        if (options.preserveCase) {
            for (const entry of this._headersMap.values()) {
                result[entry.name] = entry.value;
            }
        }
        else {
            for (const [normalizedName, entry] of this._headersMap) {
                result[normalizedName] = entry.value;
            }
        }
        return result;
    }
    /**
     * Get the string representation of this HTTP header collection.
     */
    toString() {
        return JSON.stringify(this.toJSON({ preserveCase: true }));
    }
    /**
     * Iterate over tuples of header [name, value] pairs.
     */
    [Symbol.iterator]() {
        return headerIterator(this._headersMap);
    }
}
/**
 * Creates an object that satisfies the `HttpHeaders` interface.
 * @param rawHeaders - A simple object representing initial headers
 */
function createHttpHeaders(rawHeaders) {
    return new HttpHeadersImpl(rawHeaders);
}

// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.
var _a$1;
// NOTE: This is a workaround until we can use `globalThis.crypto.randomUUID` in Node.js 19+.
const uuidFunction = typeof ((_a$1 = globalThis === null || globalThis === void 0 ? void 0 : globalThis.crypto) === null || _a$1 === void 0 ? void 0 : _a$1.randomUUID) === "function"
    ? globalThis.crypto.randomUUID.bind(globalThis.crypto)
    : randomUUID$1;
/**
 * Generated Universally Unique Identifier
 *
 * @returns RFC4122 v4 UUID.
 */
function randomUUID() {
    return uuidFunction();
}

// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.
class PipelineRequestImpl {
    constructor(options) {
        var _a, _b, _c, _d, _e, _f, _g;
        this.url = options.url;
        this.body = options.body;
        this.headers = (_a = options.headers) !== null && _a !== void 0 ? _a : createHttpHeaders();
        this.method = (_b = options.method) !== null && _b !== void 0 ? _b : "GET";
        this.timeout = (_c = options.timeout) !== null && _c !== void 0 ? _c : 0;
        this.multipartBody = options.multipartBody;
        this.formData = options.formData;
        this.disableKeepAlive = (_d = options.disableKeepAlive) !== null && _d !== void 0 ? _d : false;
        this.proxySettings = options.proxySettings;
        this.streamResponseStatusCodes = options.streamResponseStatusCodes;
        this.withCredentials = (_e = options.withCredentials) !== null && _e !== void 0 ? _e : false;
        this.abortSignal = options.abortSignal;
        this.onUploadProgress = options.onUploadProgress;
        this.onDownloadProgress = options.onDownloadProgress;
        this.requestId = options.requestId || randomUUID();
        this.allowInsecureConnection = (_f = options.allowInsecureConnection) !== null && _f !== void 0 ? _f : false;
        this.enableBrowserStreams = (_g = options.enableBrowserStreams) !== null && _g !== void 0 ? _g : false;
        this.requestOverrides = options.requestOverrides;
    }
}
/**
 * Creates a new pipeline request with the given options.
 * This method is to allow for the easy setting of default values and not required.
 * @param options - The options to create the request with.
 */
function createPipelineRequest(options) {
    return new PipelineRequestImpl(options);
}

// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.
const ValidPhaseNames = new Set(["Deserialize", "Serialize", "Retry", "Sign"]);
/**
 * A private implementation of Pipeline.
 * Do not export this class from the package.
 * @internal
 */
class HttpPipeline {
    constructor(policies) {
        var _a;
        this._policies = [];
        this._policies = (_a = policies === null || policies === void 0 ? void 0 : policies.slice(0)) !== null && _a !== void 0 ? _a : [];
        this._orderedPolicies = undefined;
    }
    addPolicy(policy, options = {}) {
        if (options.phase && options.afterPhase) {
            throw new Error("Policies inside a phase cannot specify afterPhase.");
        }
        if (options.phase && !ValidPhaseNames.has(options.phase)) {
            throw new Error(`Invalid phase name: ${options.phase}`);
        }
        if (options.afterPhase && !ValidPhaseNames.has(options.afterPhase)) {
            throw new Error(`Invalid afterPhase name: ${options.afterPhase}`);
        }
        this._policies.push({
            policy,
            options,
        });
        this._orderedPolicies = undefined;
    }
    removePolicy(options) {
        const removedPolicies = [];
        this._policies = this._policies.filter((policyDescriptor) => {
            if ((options.name && policyDescriptor.policy.name === options.name) ||
                (options.phase && policyDescriptor.options.phase === options.phase)) {
                removedPolicies.push(policyDescriptor.policy);
                return false;
            }
            else {
                return true;
            }
        });
        this._orderedPolicies = undefined;
        return removedPolicies;
    }
    sendRequest(httpClient, request) {
        const policies = this.getOrderedPolicies();
        const pipeline = policies.reduceRight((next, policy) => {
            return (req) => {
                return policy.sendRequest(req, next);
            };
        }, (req) => httpClient.sendRequest(req));
        return pipeline(request);
    }
    getOrderedPolicies() {
        if (!this._orderedPolicies) {
            this._orderedPolicies = this.orderPolicies();
        }
        return this._orderedPolicies;
    }
    clone() {
        return new HttpPipeline(this._policies);
    }
    static create() {
        return new HttpPipeline();
    }
    orderPolicies() {
        /**
         * The goal of this method is to reliably order pipeline policies
         * based on their declared requirements when they were added.
         *
         * Order is first determined by phase:
         *
         * 1. Serialize Phase
         * 2. Policies not in a phase
         * 3. Deserialize Phase
         * 4. Retry Phase
         * 5. Sign Phase
         *
         * Within each phase, policies are executed in the order
         * they were added unless they were specified to execute
         * before/after other policies or after a particular phase.
         *
         * To determine the final order, we will walk the policy list
         * in phase order multiple times until all dependencies are
         * satisfied.
         *
         * `afterPolicies` are the set of policies that must be
         * executed before a given policy. This requirement is
         * considered satisfied when each of the listed policies
         * have been scheduled.
         *
         * `beforePolicies` are the set of policies that must be
         * executed after a given policy. Since this dependency
         * can be expressed by converting it into a equivalent
         * `afterPolicies` declarations, they are normalized
         * into that form for simplicity.
         *
         * An `afterPhase` dependency is considered satisfied when all
         * policies in that phase have scheduled.
         *
         */
        const result = [];
        // Track all policies we know about.
        const policyMap = new Map();
        function createPhase(name) {
            return {
                name,
                policies: new Set(),
                hasRun: false,
                hasAfterPolicies: false,
            };
        }
        // Track policies for each phase.
        const serializePhase = createPhase("Serialize");
        const noPhase = createPhase("None");
        const deserializePhase = createPhase("Deserialize");
        const retryPhase = createPhase("Retry");
        const signPhase = createPhase("Sign");
        // a list of phases in order
        const orderedPhases = [serializePhase, noPhase, deserializePhase, retryPhase, signPhase];
        // Small helper function to map phase name to each Phase
        function getPhase(phase) {
            if (phase === "Retry") {
                return retryPhase;
            }
            else if (phase === "Serialize") {
                return serializePhase;
            }
            else if (phase === "Deserialize") {
                return deserializePhase;
            }
            else if (phase === "Sign") {
                return signPhase;
            }
            else {
                return noPhase;
            }
        }
        // First walk each policy and create a node to track metadata.
        for (const descriptor of this._policies) {
            const policy = descriptor.policy;
            const options = descriptor.options;
            const policyName = policy.name;
            if (policyMap.has(policyName)) {
                throw new Error("Duplicate policy names not allowed in pipeline");
            }
            const node = {
                policy,
                dependsOn: new Set(),
                dependants: new Set(),
            };
            if (options.afterPhase) {
                node.afterPhase = getPhase(options.afterPhase);
                node.afterPhase.hasAfterPolicies = true;
            }
            policyMap.set(policyName, node);
            const phase = getPhase(options.phase);
            phase.policies.add(node);
        }
        // Now that each policy has a node, connect dependency references.
        for (const descriptor of this._policies) {
            const { policy, options } = descriptor;
            const policyName = policy.name;
            const node = policyMap.get(policyName);
            if (!node) {
                throw new Error(`Missing node for policy ${policyName}`);
            }
            if (options.afterPolicies) {
                for (const afterPolicyName of options.afterPolicies) {
                    const afterNode = policyMap.get(afterPolicyName);
                    if (afterNode) {
                        // Linking in both directions helps later
                        // when we want to notify dependants.
                        node.dependsOn.add(afterNode);
                        afterNode.dependants.add(node);
                    }
                }
            }
            if (options.beforePolicies) {
                for (const beforePolicyName of options.beforePolicies) {
                    const beforeNode = policyMap.get(beforePolicyName);
                    if (beforeNode) {
                        // To execute before another node, make it
                        // depend on the current node.
                        beforeNode.dependsOn.add(node);
                        node.dependants.add(beforeNode);
                    }
                }
            }
        }
        function walkPhase(phase) {
            phase.hasRun = true;
            // Sets iterate in insertion order
            for (const node of phase.policies) {
                if (node.afterPhase && (!node.afterPhase.hasRun || node.afterPhase.policies.size)) {
                    // If this node is waiting on a phase to complete,
                    // we need to skip it for now.
                    // Even if the phase is empty, we should wait for it
                    // to be walked to avoid re-ordering policies.
                    continue;
                }
                if (node.dependsOn.size === 0) {
                    // If there's nothing else we're waiting for, we can
                    // add this policy to the result list.
                    result.push(node.policy);
                    // Notify anything that depends on this policy that
                    // the policy has been scheduled.
                    for (const dependant of node.dependants) {
                        dependant.dependsOn.delete(node);
                    }
                    policyMap.delete(node.policy.name);
                    phase.policies.delete(node);
                }
            }
        }
        function walkPhases() {
            for (const phase of orderedPhases) {
                walkPhase(phase);
                // if the phase isn't complete
                if (phase.policies.size > 0 && phase !== noPhase) {
                    if (!noPhase.hasRun) {
                        // Try running noPhase to see if that unblocks this phase next tick.
                        // This can happen if a phase that happens before noPhase
                        // is waiting on a noPhase policy to complete.
                        walkPhase(noPhase);
                    }
                    // Don't proceed to the next phase until this phase finishes.
                    return;
                }
                if (phase.hasAfterPolicies) {
                    // Run any policies unblocked by this phase
                    walkPhase(noPhase);
                }
            }
        }
        // Iterate until we've put every node in the result list.
        let iteration = 0;
        while (policyMap.size > 0) {
            iteration++;
            const initialResultLength = result.length;
            // Keep walking each phase in order until we can order every node.
            walkPhases();
            // The result list *should* get at least one larger each time
            // after the first full pass.
            // Otherwise, we're going to loop forever.
            if (result.length <= initialResultLength && iteration > 1) {
                throw new Error("Cannot satisfy policy dependencies due to requirements cycle.");
            }
        }
        return result;
    }
}
/**
 * Creates a totally empty pipeline.
 * Useful for testing or creating a custom one.
 */
function createEmptyPipeline$1() {
    return HttpPipeline.create();
}

// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.
/**
 * Helper to determine when an input is a generic JS object.
 * @returns true when input is an object type that is not null, Array, RegExp, or Date.
 */
function isObject(input) {
    return (typeof input === "object" &&
        input !== null &&
        !Array.isArray(input) &&
        !(input instanceof RegExp) &&
        !(input instanceof Date));
}

// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.
/**
 * Typeguard for an error object shape (has name and message)
 * @param e - Something caught by a catch clause.
 */
function isError$1(e) {
    if (isObject(e)) {
        const hasName = typeof e.name === "string";
        const hasMessage = typeof e.message === "string";
        return hasName && hasMessage;
    }
    return false;
}

// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.
const custom = inspect.custom;

// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.
const RedactedString = "REDACTED";
// Make sure this list is up-to-date with the one under core/logger/Readme#Keyconcepts
const defaultAllowedHeaderNames = [
    "x-ms-client-request-id",
    "x-ms-return-client-request-id",
    "x-ms-useragent",
    "x-ms-correlation-request-id",
    "x-ms-request-id",
    "client-request-id",
    "ms-cv",
    "return-client-request-id",
    "traceparent",
    "Access-Control-Allow-Credentials",
    "Access-Control-Allow-Headers",
    "Access-Control-Allow-Methods",
    "Access-Control-Allow-Origin",
    "Access-Control-Expose-Headers",
    "Access-Control-Max-Age",
    "Access-Control-Request-Headers",
    "Access-Control-Request-Method",
    "Origin",
    "Accept",
    "Accept-Encoding",
    "Cache-Control",
    "Connection",
    "Content-Length",
    "Content-Type",
    "Date",
    "ETag",
    "Expires",
    "If-Match",
    "If-Modified-Since",
    "If-None-Match",
    "If-Unmodified-Since",
    "Last-Modified",
    "Pragma",
    "Request-Id",
    "Retry-After",
    "Server",
    "Transfer-Encoding",
    "User-Agent",
    "WWW-Authenticate",
];
const defaultAllowedQueryParameters = ["api-version"];
/**
 * A utility class to sanitize objects for logging.
 */
class Sanitizer {
    constructor({ additionalAllowedHeaderNames: allowedHeaderNames = [], additionalAllowedQueryParameters: allowedQueryParameters = [], } = {}) {
        allowedHeaderNames = defaultAllowedHeaderNames.concat(allowedHeaderNames);
        allowedQueryParameters = defaultAllowedQueryParameters.concat(allowedQueryParameters);
        this.allowedHeaderNames = new Set(allowedHeaderNames.map((n) => n.toLowerCase()));
        this.allowedQueryParameters = new Set(allowedQueryParameters.map((p) => p.toLowerCase()));
    }
    /**
     * Sanitizes an object for logging.
     * @param obj - The object to sanitize
     * @returns - The sanitized object as a string
     */
    sanitize(obj) {
        const seen = new Set();
        return JSON.stringify(obj, (key, value) => {
            // Ensure Errors include their interesting non-enumerable members
            if (value instanceof Error) {
                return Object.assign(Object.assign({}, value), { name: value.name, message: value.message });
            }
            if (key === "headers") {
                return this.sanitizeHeaders(value);
            }
            else if (key === "url") {
                return this.sanitizeUrl(value);
            }
            else if (key === "query") {
                return this.sanitizeQuery(value);
            }
            else if (key === "body") {
                // Don't log the request body
                return undefined;
            }
            else if (key === "response") {
                // Don't log response again
                return undefined;
            }
            else if (key === "operationSpec") {
                // When using sendOperationRequest, the request carries a massive
                // field with the autorest spec. No need to log it.
                return undefined;
            }
            else if (Array.isArray(value) || isObject(value)) {
                if (seen.has(value)) {
                    return "[Circular]";
                }
                seen.add(value);
            }
            return value;
        }, 2);
    }
    /**
     * Sanitizes a URL for logging.
     * @param value - The URL to sanitize
     * @returns - The sanitized URL as a string
     */
    sanitizeUrl(value) {
        if (typeof value !== "string" || value === null || value === "") {
            return value;
        }
        const url = new URL(value);
        if (!url.search) {
            return value;
        }
        for (const [key] of url.searchParams) {
            if (!this.allowedQueryParameters.has(key.toLowerCase())) {
                url.searchParams.set(key, RedactedString);
            }
        }
        return url.toString();
    }
    sanitizeHeaders(obj) {
        const sanitized = {};
        for (const key of Object.keys(obj)) {
            if (this.allowedHeaderNames.has(key.toLowerCase())) {
                sanitized[key] = obj[key];
            }
            else {
                sanitized[key] = RedactedString;
            }
        }
        return sanitized;
    }
    sanitizeQuery(value) {
        if (typeof value !== "object" || value === null) {
            return value;
        }
        const sanitized = {};
        for (const k of Object.keys(value)) {
            if (this.allowedQueryParameters.has(k.toLowerCase())) {
                sanitized[k] = value[k];
            }
            else {
                sanitized[k] = RedactedString;
            }
        }
        return sanitized;
    }
}

// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.
const errorSanitizer = new Sanitizer();
/**
 * A custom error type for failed pipeline requests.
 */
let RestError$1 = class RestError extends Error {
    constructor(message, options = {}) {
        super(message);
        this.name = "RestError";
        this.code = options.code;
        this.statusCode = options.statusCode;
        // The request and response may contain sensitive information in the headers or body.
        // To help prevent this sensitive information being accidentally logged, the request and response
        // properties are marked as non-enumerable here. This prevents them showing up in the output of
        // JSON.stringify and console.log.
        Object.defineProperty(this, "request", { value: options.request, enumerable: false });
        Object.defineProperty(this, "response", { value: options.response, enumerable: false });
        // Logging method for util.inspect in Node
        Object.defineProperty(this, custom, {
            value: () => {
                // Extract non-enumerable properties and add them back. This is OK since in this output the request and
                // response get sanitized.
                return `RestError: ${this.message} \n ${errorSanitizer.sanitize(Object.assign(Object.assign({}, this), { request: this.request, response: this.response }))}`;
            },
            enumerable: false,
        });
        Object.setPrototypeOf(this, RestError.prototype);
    }
};
/**
 * Something went wrong when making the request.
 * This means the actual request failed for some reason,
 * such as a DNS issue or the connection being lost.
 */
RestError$1.REQUEST_SEND_ERROR = "REQUEST_SEND_ERROR";
/**
 * This means that parsing the response from the server failed.
 * It may have been malformed.
 */
RestError$1.PARSE_ERROR = "PARSE_ERROR";
/**
 * Typeguard for RestError
 * @param e - Something caught by a catch clause.
 */
function isRestError$1(e) {
    if (e instanceof RestError$1) {
        return true;
    }
    return isError$1(e) && e.name === "RestError";
}

// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.
/**
 * The helper that transforms bytes with specific character encoding into string
 * @param bytes - the uint8array bytes
 * @param format - the format we use to encode the byte
 * @returns a string of the encoded string
 */
function uint8ArrayToString(bytes, format) {
    return Buffer.from(bytes).toString(format);
}
/**
 * The helper that transforms string to specific character encoded bytes array.
 * @param value - the string to be converted
 * @param format - the format we use to decode the value
 * @returns a uint8array
 */
function stringToUint8Array(value, format) {
    return Buffer.from(value, format);
}

// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.
const logger$2 = createClientLogger$1("ts-http-runtime");

// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.
const DEFAULT_TLS_SETTINGS = {};
function isReadableStream$1(body) {
    return body && typeof body.pipe === "function";
}
function isStreamComplete(stream) {
    if (stream.readable === false) {
        return Promise.resolve();
    }
    return new Promise((resolve) => {
        const handler = () => {
            resolve();
            stream.removeListener("close", handler);
            stream.removeListener("end", handler);
            stream.removeListener("error", handler);
        };
        stream.on("close", handler);
        stream.on("end", handler);
        stream.on("error", handler);
    });
}
function isArrayBuffer(body) {
    return body && typeof body.byteLength === "number";
}
class ReportTransform extends Transform {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
    _transform(chunk, _encoding, callback) {
        this.push(chunk);
        this.loadedBytes += chunk.length;
        try {
            this.progressCallback({ loadedBytes: this.loadedBytes });
            callback();
        }
        catch (e) {
            callback(e);
        }
    }
    constructor(progressCallback) {
        super();
        this.loadedBytes = 0;
        this.progressCallback = progressCallback;
    }
}
/**
 * A HttpClient implementation that uses Node's "https" module to send HTTPS requests.
 * @internal
 */
class NodeHttpClient {
    constructor() {
        this.cachedHttpsAgents = new WeakMap();
    }
    /**
     * Makes a request over an underlying transport layer and returns the response.
     * @param request - The request to be made.
     */
    async sendRequest(request) {
        var _a, _b, _c;
        const abortController = new AbortController();
        let abortListener;
        if (request.abortSignal) {
            if (request.abortSignal.aborted) {
                throw new AbortError$1("The operation was aborted. Request has already been canceled.");
            }
            abortListener = (event) => {
                if (event.type === "abort") {
                    abortController.abort();
                }
            };
            request.abortSignal.addEventListener("abort", abortListener);
        }
        let timeoutId;
        if (request.timeout > 0) {
            timeoutId = setTimeout(() => {
                const sanitizer = new Sanitizer();
                logger$2.info(`request to '${sanitizer.sanitizeUrl(request.url)}' timed out. canceling...`);
                abortController.abort();
            }, request.timeout);
        }
        const acceptEncoding = request.headers.get("Accept-Encoding");
        const shouldDecompress = (acceptEncoding === null || acceptEncoding === void 0 ? void 0 : acceptEncoding.includes("gzip")) || (acceptEncoding === null || acceptEncoding === void 0 ? void 0 : acceptEncoding.includes("deflate"));
        let body = typeof request.body === "function" ? request.body() : request.body;
        if (body && !request.headers.has("Content-Length")) {
            const bodyLength = getBodyLength(body);
            if (bodyLength !== null) {
                request.headers.set("Content-Length", bodyLength);
            }
        }
        let responseStream;
        try {
            if (body && request.onUploadProgress) {
                const onUploadProgress = request.onUploadProgress;
                const uploadReportStream = new ReportTransform(onUploadProgress);
                uploadReportStream.on("error", (e) => {
                    logger$2.error("Error in upload progress", e);
                });
                if (isReadableStream$1(body)) {
                    body.pipe(uploadReportStream);
                }
                else {
                    uploadReportStream.end(body);
                }
                body = uploadReportStream;
            }
            const res = await this.makeRequest(request, abortController, body);
            if (timeoutId !== undefined) {
                clearTimeout(timeoutId);
            }
            const headers = getResponseHeaders(res);
            const status = (_a = res.statusCode) !== null && _a !== void 0 ? _a : 0;
            const response = {
                status,
                headers,
                request,
            };
            // Responses to HEAD must not have a body.
            // If they do return a body, that body must be ignored.
            if (request.method === "HEAD") {
                // call resume() and not destroy() to avoid closing the socket
                // and losing keep alive
                res.resume();
                return response;
            }
            responseStream = shouldDecompress ? getDecodedResponseStream(res, headers) : res;
            const onDownloadProgress = request.onDownloadProgress;
            if (onDownloadProgress) {
                const downloadReportStream = new ReportTransform(onDownloadProgress);
                downloadReportStream.on("error", (e) => {
                    logger$2.error("Error in download progress", e);
                });
                responseStream.pipe(downloadReportStream);
                responseStream = downloadReportStream;
            }
            if (
            // Value of POSITIVE_INFINITY in streamResponseStatusCodes is considered as any status code
            ((_b = request.streamResponseStatusCodes) === null || _b === void 0 ? void 0 : _b.has(Number.POSITIVE_INFINITY)) ||
                ((_c = request.streamResponseStatusCodes) === null || _c === void 0 ? void 0 : _c.has(response.status))) {
                response.readableStreamBody = responseStream;
            }
            else {
                response.bodyAsText = await streamToText(responseStream);
            }
            return response;
        }
        finally {
            // clean up event listener
            if (request.abortSignal && abortListener) {
                let uploadStreamDone = Promise.resolve();
                if (isReadableStream$1(body)) {
                    uploadStreamDone = isStreamComplete(body);
                }
                let downloadStreamDone = Promise.resolve();
                if (isReadableStream$1(responseStream)) {
                    downloadStreamDone = isStreamComplete(responseStream);
                }
                Promise.all([uploadStreamDone, downloadStreamDone])
                    .then(() => {
                    var _a;
                    // eslint-disable-next-line promise/always-return
                    if (abortListener) {
                        (_a = request.abortSignal) === null || _a === void 0 ? void 0 : _a.removeEventListener("abort", abortListener);
                    }
                })
                    .catch((e) => {
                    logger$2.warning("Error when cleaning up abortListener on httpRequest", e);
                });
            }
        }
    }
    makeRequest(request, abortController, body) {
        var _a;
        const url = new URL(request.url);
        const isInsecure = url.protocol !== "https:";
        if (isInsecure && !request.allowInsecureConnection) {
            throw new Error(`Cannot connect to ${request.url} while allowInsecureConnection is false.`);
        }
        const agent = (_a = request.agent) !== null && _a !== void 0 ? _a : this.getOrCreateAgent(request, isInsecure);
        const options = Object.assign({ agent, hostname: url.hostname, path: `${url.pathname}${url.search}`, port: url.port, method: request.method, headers: request.headers.toJSON({ preserveCase: true }) }, request.requestOverrides);
        return new Promise((resolve, reject) => {
            const req = isInsecure ? http.request(options, resolve) : https.request(options, resolve);
            req.once("error", (err) => {
                var _a;
                reject(new RestError$1(err.message, { code: (_a = err.code) !== null && _a !== void 0 ? _a : RestError$1.REQUEST_SEND_ERROR, request }));
            });
            abortController.signal.addEventListener("abort", () => {
                const abortError = new AbortError$1("The operation was aborted. Rejecting from abort signal callback while making request.");
                req.destroy(abortError);
                reject(abortError);
            });
            if (body && isReadableStream$1(body)) {
                body.pipe(req);
            }
            else if (body) {
                if (typeof body === "string" || Buffer.isBuffer(body)) {
                    req.end(body);
                }
                else if (isArrayBuffer(body)) {
                    req.end(ArrayBuffer.isView(body) ? Buffer.from(body.buffer) : Buffer.from(body));
                }
                else {
                    logger$2.error("Unrecognized body type", body);
                    reject(new RestError$1("Unrecognized body type"));
                }
            }
            else {
                // streams don't like "undefined" being passed as data
                req.end();
            }
        });
    }
    getOrCreateAgent(request, isInsecure) {
        var _a;
        const disableKeepAlive = request.disableKeepAlive;
        // Handle Insecure requests first
        if (isInsecure) {
            if (disableKeepAlive) {
                // keepAlive:false is the default so we don't need a custom Agent
                return http.globalAgent;
            }
            if (!this.cachedHttpAgent) {
                // If there is no cached agent create a new one and cache it.
                this.cachedHttpAgent = new http.Agent({ keepAlive: true });
            }
            return this.cachedHttpAgent;
        }
        else {
            if (disableKeepAlive && !request.tlsSettings) {
                // When there are no tlsSettings and keepAlive is false
                // we don't need a custom agent
                return https.globalAgent;
            }
            // We use the tlsSettings to index cached clients
            const tlsSettings = (_a = request.tlsSettings) !== null && _a !== void 0 ? _a : DEFAULT_TLS_SETTINGS;
            // Get the cached agent or create a new one with the
            // provided values for keepAlive and tlsSettings
            let agent = this.cachedHttpsAgents.get(tlsSettings);
            if (agent && agent.options.keepAlive === !disableKeepAlive) {
                return agent;
            }
            logger$2.info("No cached TLS Agent exist, creating a new Agent");
            agent = new https.Agent(Object.assign({ 
                // keepAlive is true if disableKeepAlive is false.
                keepAlive: !disableKeepAlive }, tlsSettings));
            this.cachedHttpsAgents.set(tlsSettings, agent);
            return agent;
        }
    }
}
function getResponseHeaders(res) {
    const headers = createHttpHeaders();
    for (const header of Object.keys(res.headers)) {
        const value = res.headers[header];
        if (Array.isArray(value)) {
            if (value.length > 0) {
                headers.set(header, value[0]);
            }
        }
        else if (value) {
            headers.set(header, value);
        }
    }
    return headers;
}
function getDecodedResponseStream(stream, headers) {
    const contentEncoding = headers.get("Content-Encoding");
    if (contentEncoding === "gzip") {
        const unzip = zlib.createGunzip();
        stream.pipe(unzip);
        return unzip;
    }
    else if (contentEncoding === "deflate") {
        const inflate = zlib.createInflate();
        stream.pipe(inflate);
        return inflate;
    }
    return stream;
}
function streamToText(stream) {
    return new Promise((resolve, reject) => {
        const buffer = [];
        stream.on("data", (chunk) => {
            if (Buffer.isBuffer(chunk)) {
                buffer.push(chunk);
            }
            else {
                buffer.push(Buffer.from(chunk));
            }
        });
        stream.on("end", () => {
            resolve(Buffer.concat(buffer).toString("utf8"));
        });
        stream.on("error", (e) => {
            if (e && (e === null || e === void 0 ? void 0 : e.name) === "AbortError") {
                reject(e);
            }
            else {
                reject(new RestError$1(`Error reading response as text: ${e.message}`, {
                    code: RestError$1.PARSE_ERROR,
                }));
            }
        });
    });
}
/** @internal */
function getBodyLength(body) {
    if (!body) {
        return 0;
    }
    else if (Buffer.isBuffer(body)) {
        return body.length;
    }
    else if (isReadableStream$1(body)) {
        return null;
    }
    else if (isArrayBuffer(body)) {
        return body.byteLength;
    }
    else if (typeof body === "string") {
        return Buffer.from(body).length;
    }
    else {
        return null;
    }
}
/**
 * Create a new HttpClient instance for the NodeJS environment.
 * @internal
 */
function createNodeHttpClient() {
    return new NodeHttpClient();
}

// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.
/**
 * Create the correct HttpClient for the current environment.
 */
function createDefaultHttpClient() {
    return createNodeHttpClient();
}

// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.
/**
 * The programmatic identifier of the logPolicy.
 */
const logPolicyName = "logPolicy";
/**
 * A policy that logs all requests and responses.
 * @param options - Options to configure logPolicy.
 */
function logPolicy$1(options = {}) {
    var _a;
    const logger = (_a = options.logger) !== null && _a !== void 0 ? _a : logger$2.info;
    const sanitizer = new Sanitizer({
        additionalAllowedHeaderNames: options.additionalAllowedHeaderNames,
        additionalAllowedQueryParameters: options.additionalAllowedQueryParameters,
    });
    return {
        name: logPolicyName,
        async sendRequest(request, next) {
            if (!logger.enabled) {
                return next(request);
            }
            logger(`Request: ${sanitizer.sanitize(request)}`);
            const response = await next(request);
            logger(`Response status code: ${response.status}`);
            logger(`Headers: ${sanitizer.sanitize(response.headers)}`);
            return response;
        },
    };
}

// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.
/**
 * The programmatic identifier of the redirectPolicy.
 */
const redirectPolicyName = "redirectPolicy";
/**
 * Methods that are allowed to follow redirects 301 and 302
 */
const allowedRedirect = ["GET", "HEAD"];
/**
 * A policy to follow Location headers from the server in order
 * to support server-side redirection.
 * In the browser, this policy is not used.
 * @param options - Options to control policy behavior.
 */
function redirectPolicy$1(options = {}) {
    const { maxRetries = 20 } = options;
    return {
        name: redirectPolicyName,
        async sendRequest(request, next) {
            const response = await next(request);
            return handleRedirect(next, response, maxRetries);
        },
    };
}
async function handleRedirect(next, response, maxRetries, currentRetries = 0) {
    const { request, status, headers } = response;
    const locationHeader = headers.get("location");
    if (locationHeader &&
        (status === 300 ||
            (status === 301 && allowedRedirect.includes(request.method)) ||
            (status === 302 && allowedRedirect.includes(request.method)) ||
            (status === 303 && request.method === "POST") ||
            status === 307) &&
        currentRetries < maxRetries) {
        const url = new URL(locationHeader, request.url);
        request.url = url.toString();
        // POST request with Status code 303 should be converted into a
        // redirected GET request if the redirect url is present in the location header
        if (status === 303) {
            request.method = "GET";
            request.headers.delete("Content-Length");
            delete request.body;
        }
        request.headers.delete("Authorization");
        const res = await next(request);
        return handleRedirect(next, res, maxRetries, currentRetries + 1);
    }
    return response;
}

// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.
/**
 * @internal
 */
function getHeaderName$1() {
    return "User-Agent";
}
/**
 * @internal
 */
async function setPlatformSpecificData$1(map) {
    if (process$1 && process$1.versions) {
        const versions = process$1.versions;
        if (versions.bun) {
            map.set("Bun", versions.bun);
        }
        else if (versions.deno) {
            map.set("Deno", versions.deno);
        }
        else if (versions.node) {
            map.set("Node", versions.node);
        }
    }
    map.set("OS", `(${os.arch()}-${os.type()}-${os.release()})`);
}

// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.
const SDK_VERSION$2 = "0.2.2";
const DEFAULT_RETRY_POLICY_COUNT = 3;

// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.
function getUserAgentString$1(telemetryInfo) {
    const parts = [];
    for (const [key, value] of telemetryInfo) {
        const token = value ? `${key}/${value}` : key;
        parts.push(token);
    }
    return parts.join(" ");
}
/**
 * @internal
 */
function getUserAgentHeaderName$1() {
    return getHeaderName$1();
}
/**
 * @internal
 */
async function getUserAgentValue$1(prefix) {
    const runtimeInfo = new Map();
    runtimeInfo.set("ts-http-runtime", SDK_VERSION$2);
    await setPlatformSpecificData$1(runtimeInfo);
    const defaultAgent = getUserAgentString$1(runtimeInfo);
    const userAgentValue = prefix ? `${prefix} ${defaultAgent}` : defaultAgent;
    return userAgentValue;
}

// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.
const UserAgentHeaderName$1 = getUserAgentHeaderName$1();
/**
 * The programmatic identifier of the userAgentPolicy.
 */
const userAgentPolicyName$1 = "userAgentPolicy";
/**
 * A policy that sets the User-Agent header (or equivalent) to reflect
 * the library version.
 * @param options - Options to customize the user agent value.
 */
function userAgentPolicy$1(options = {}) {
    const userAgentValue = getUserAgentValue$1(options.userAgentPrefix);
    return {
        name: userAgentPolicyName$1,
        async sendRequest(request, next) {
            if (!request.headers.has(UserAgentHeaderName$1)) {
                request.headers.set(UserAgentHeaderName$1, await userAgentValue);
            }
            return next(request);
        },
    };
}

// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.
/**
 * The programmatic identifier of the decompressResponsePolicy.
 */
const decompressResponsePolicyName = "decompressResponsePolicy";
/**
 * A policy to enable response decompression according to Accept-Encoding header
 * https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Accept-Encoding
 */
function decompressResponsePolicy$1() {
    return {
        name: decompressResponsePolicyName,
        async sendRequest(request, next) {
            // HEAD requests have no body
            if (request.method !== "HEAD") {
                request.headers.set("Accept-Encoding", "gzip,deflate");
            }
            return next(request);
        },
    };
}

// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.
/**
 * Returns a random integer value between a lower and upper bound,
 * inclusive of both bounds.
 * Note that this uses Math.random and isn't secure. If you need to use
 * this for any kind of security purpose, find a better source of random.
 * @param min - The smallest integer value allowed.
 * @param max - The largest integer value allowed.
 */
function getRandomIntegerInclusive(min, max) {
    // Make sure inputs are integers.
    min = Math.ceil(min);
    max = Math.floor(max);
    // Pick a random offset from zero to the size of the range.
    // Since Math.random() can never return 1, we have to make the range one larger
    // in order to be inclusive of the maximum value after we take the floor.
    const offset = Math.floor(Math.random() * (max - min + 1));
    return offset + min;
}

// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.
/**
 * Calculates the delay interval for retry attempts using exponential delay with jitter.
 * @param retryAttempt - The current retry attempt number.
 * @param config - The exponential retry configuration.
 * @returns An object containing the calculated retry delay.
 */
function calculateRetryDelay(retryAttempt, config) {
    // Exponentially increase the delay each time
    const exponentialDelay = config.retryDelayInMs * Math.pow(2, retryAttempt);
    // Don't let the delay exceed the maximum
    const clampedDelay = Math.min(config.maxRetryDelayInMs, exponentialDelay);
    // Allow the final value to have some "jitter" (within 50% of the delay size) so
    // that retries across multiple clients don't occur simultaneously.
    const retryAfterInMs = clampedDelay / 2 + getRandomIntegerInclusive(0, clampedDelay / 2);
    return { retryAfterInMs };
}

// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.
const StandardAbortMessage$1 = "The operation was aborted.";
/**
 * A wrapper for setTimeout that resolves a promise after delayInMs milliseconds.
 * @param delayInMs - The number of milliseconds to be delayed.
 * @param value - The value to be resolved with after a timeout of t milliseconds.
 * @param options - The options for delay - currently abort options
 *                  - abortSignal - The abortSignal associated with containing operation.
 *                  - abortErrorMsg - The abort error message associated with containing operation.
 * @returns Resolved promise
 */
function delay$1(delayInMs, value, options) {
    return new Promise((resolve, reject) => {
        let timer = undefined;
        let onAborted = undefined;
        const rejectOnAbort = () => {
            return reject(new AbortError$1((options === null || options === void 0 ? void 0 : options.abortErrorMsg) ? options === null || options === void 0 ? void 0 : options.abortErrorMsg : StandardAbortMessage$1));
        };
        const removeListeners = () => {
            if ((options === null || options === void 0 ? void 0 : options.abortSignal) && onAborted) {
                options.abortSignal.removeEventListener("abort", onAborted);
            }
        };
        onAborted = () => {
            if (timer) {
                clearTimeout(timer);
            }
            removeListeners();
            return rejectOnAbort();
        };
        if ((options === null || options === void 0 ? void 0 : options.abortSignal) && options.abortSignal.aborted) {
            return rejectOnAbort();
        }
        timer = setTimeout(() => {
            removeListeners();
            resolve(value);
        }, delayInMs);
        if (options === null || options === void 0 ? void 0 : options.abortSignal) {
            options.abortSignal.addEventListener("abort", onAborted);
        }
    });
}
/**
 * @internal
 * @returns the parsed value or undefined if the parsed value is invalid.
 */
function parseHeaderValueAsNumber(response, headerName) {
    const value = response.headers.get(headerName);
    if (!value)
        return;
    const valueAsNum = Number(value);
    if (Number.isNaN(valueAsNum))
        return;
    return valueAsNum;
}

// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.
/**
 * The header that comes back from services representing
 * the amount of time (minimum) to wait to retry (in seconds or timestamp after which we can retry).
 */
const RetryAfterHeader = "Retry-After";
/**
 * The headers that come back from services representing
 * the amount of time (minimum) to wait to retry.
 *
 * "retry-after-ms", "x-ms-retry-after-ms" : milliseconds
 * "Retry-After" : seconds or timestamp
 */
const AllRetryAfterHeaders = ["retry-after-ms", "x-ms-retry-after-ms", RetryAfterHeader];
/**
 * A response is a throttling retry response if it has a throttling status code (429 or 503),
 * as long as one of the [ "Retry-After" or "retry-after-ms" or "x-ms-retry-after-ms" ] headers has a valid value.
 *
 * Returns the `retryAfterInMs` value if the response is a throttling retry response.
 * If not throttling retry response, returns `undefined`.
 *
 * @internal
 */
function getRetryAfterInMs(response) {
    if (!(response && [429, 503].includes(response.status)))
        return undefined;
    try {
        // Headers: "retry-after-ms", "x-ms-retry-after-ms", "Retry-After"
        for (const header of AllRetryAfterHeaders) {
            const retryAfterValue = parseHeaderValueAsNumber(response, header);
            if (retryAfterValue === 0 || retryAfterValue) {
                // "Retry-After" header ==> seconds
                // "retry-after-ms", "x-ms-retry-after-ms" headers ==> milli-seconds
                const multiplyingFactor = header === RetryAfterHeader ? 1000 : 1;
                return retryAfterValue * multiplyingFactor; // in milli-seconds
            }
        }
        // RetryAfterHeader ("Retry-After") has a special case where it might be formatted as a date instead of a number of seconds
        const retryAfterHeader = response.headers.get(RetryAfterHeader);
        if (!retryAfterHeader)
            return;
        const date = Date.parse(retryAfterHeader);
        const diff = date - Date.now();
        // negative diff would mean a date in the past, so retry asap with 0 milliseconds
        return Number.isFinite(diff) ? Math.max(0, diff) : undefined;
    }
    catch (_a) {
        return undefined;
    }
}
/**
 * A response is a retry response if it has a throttling status code (429 or 503),
 * as long as one of the [ "Retry-After" or "retry-after-ms" or "x-ms-retry-after-ms" ] headers has a valid value.
 */
function isThrottlingRetryResponse(response) {
    return Number.isFinite(getRetryAfterInMs(response));
}
function throttlingRetryStrategy() {
    return {
        name: "throttlingRetryStrategy",
        retry({ response }) {
            const retryAfterInMs = getRetryAfterInMs(response);
            if (!Number.isFinite(retryAfterInMs)) {
                return { skipStrategy: true };
            }
            return {
                retryAfterInMs,
            };
        },
    };
}

// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.
// intervals are in milliseconds
const DEFAULT_CLIENT_RETRY_INTERVAL = 1000;
const DEFAULT_CLIENT_MAX_RETRY_INTERVAL = 1000 * 64;
/**
 * A retry strategy that retries with an exponentially increasing delay in these two cases:
 * - When there are errors in the underlying transport layer (e.g. DNS lookup failures).
 * - Or otherwise if the outgoing request fails (408, greater or equal than 500, except for 501 and 505).
 */
function exponentialRetryStrategy(options = {}) {
    var _a, _b;
    const retryInterval = (_a = options.retryDelayInMs) !== null && _a !== void 0 ? _a : DEFAULT_CLIENT_RETRY_INTERVAL;
    const maxRetryInterval = (_b = options.maxRetryDelayInMs) !== null && _b !== void 0 ? _b : DEFAULT_CLIENT_MAX_RETRY_INTERVAL;
    return {
        name: "exponentialRetryStrategy",
        retry({ retryCount, response, responseError }) {
            const matchedSystemError = isSystemError(responseError);
            const ignoreSystemErrors = matchedSystemError && options.ignoreSystemErrors;
            const isExponential = isExponentialRetryResponse(response);
            const ignoreExponentialResponse = isExponential && options.ignoreHttpStatusCodes;
            const unknownResponse = response && (isThrottlingRetryResponse(response) || !isExponential);
            if (unknownResponse || ignoreExponentialResponse || ignoreSystemErrors) {
                return { skipStrategy: true };
            }
            if (responseError && !matchedSystemError && !isExponential) {
                return { errorToThrow: responseError };
            }
            return calculateRetryDelay(retryCount, {
                retryDelayInMs: retryInterval,
                maxRetryDelayInMs: maxRetryInterval,
            });
        },
    };
}
/**
 * A response is a retry response if it has status codes:
 * - 408, or
 * - Greater or equal than 500, except for 501 and 505.
 */
function isExponentialRetryResponse(response) {
    return Boolean(response &&
        response.status !== undefined &&
        (response.status >= 500 || response.status === 408) &&
        response.status !== 501 &&
        response.status !== 505);
}
/**
 * Determines whether an error from a pipeline response was triggered in the network layer.
 */
function isSystemError(err) {
    if (!err) {
        return false;
    }
    return (err.code === "ETIMEDOUT" ||
        err.code === "ESOCKETTIMEDOUT" ||
        err.code === "ECONNREFUSED" ||
        err.code === "ECONNRESET" ||
        err.code === "ENOENT" ||
        err.code === "ENOTFOUND");
}

// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.
const retryPolicyLogger = createClientLogger$1("ts-http-runtime retryPolicy");
/**
 * The programmatic identifier of the retryPolicy.
 */
const retryPolicyName = "retryPolicy";
/**
 * retryPolicy is a generic policy to enable retrying requests when certain conditions are met
 */
function retryPolicy(strategies, options = { maxRetries: DEFAULT_RETRY_POLICY_COUNT }) {
    const logger = options.logger || retryPolicyLogger;
    return {
        name: retryPolicyName,
        async sendRequest(request, next) {
            var _a, _b;
            let response;
            let responseError;
            let retryCount = -1;
            retryRequest: while (true) {
                retryCount += 1;
                response = undefined;
                responseError = undefined;
                try {
                    logger.info(`Retry ${retryCount}: Attempting to send request`, request.requestId);
                    response = await next(request);
                    logger.info(`Retry ${retryCount}: Received a response from request`, request.requestId);
                }
                catch (e) {
                    logger.error(`Retry ${retryCount}: Received an error from request`, request.requestId);
                    // RestErrors are valid targets for the retry strategies.
                    // If none of the retry strategies can work with them, they will be thrown later in this policy.
                    // If the received error is not a RestError, it is immediately thrown.
                    responseError = e;
                    if (!e || responseError.name !== "RestError") {
                        throw e;
                    }
                    response = responseError.response;
                }
                if ((_a = request.abortSignal) === null || _a === void 0 ? void 0 : _a.aborted) {
                    logger.error(`Retry ${retryCount}: Request aborted.`);
                    const abortError = new AbortError$1();
                    throw abortError;
                }
                if (retryCount >= ((_b = options.maxRetries) !== null && _b !== void 0 ? _b : DEFAULT_RETRY_POLICY_COUNT)) {
                    logger.info(`Retry ${retryCount}: Maximum retries reached. Returning the last received response, or throwing the last received error.`);
                    if (responseError) {
                        throw responseError;
                    }
                    else if (response) {
                        return response;
                    }
                    else {
                        throw new Error("Maximum retries reached with no response or error to throw");
                    }
                }
                logger.info(`Retry ${retryCount}: Processing ${strategies.length} retry strategies.`);
                strategiesLoop: for (const strategy of strategies) {
                    const strategyLogger = strategy.logger || logger;
                    strategyLogger.info(`Retry ${retryCount}: Processing retry strategy ${strategy.name}.`);
                    const modifiers = strategy.retry({
                        retryCount,
                        response,
                        responseError,
                    });
                    if (modifiers.skipStrategy) {
                        strategyLogger.info(`Retry ${retryCount}: Skipped.`);
                        continue strategiesLoop;
                    }
                    const { errorToThrow, retryAfterInMs, redirectTo } = modifiers;
                    if (errorToThrow) {
                        strategyLogger.error(`Retry ${retryCount}: Retry strategy ${strategy.name} throws error:`, errorToThrow);
                        throw errorToThrow;
                    }
                    if (retryAfterInMs || retryAfterInMs === 0) {
                        strategyLogger.info(`Retry ${retryCount}: Retry strategy ${strategy.name} retries after ${retryAfterInMs}`);
                        await delay$1(retryAfterInMs, undefined, { abortSignal: request.abortSignal });
                        continue retryRequest;
                    }
                    if (redirectTo) {
                        strategyLogger.info(`Retry ${retryCount}: Retry strategy ${strategy.name} redirects to ${redirectTo}`);
                        request.url = redirectTo;
                        continue retryRequest;
                    }
                }
                if (responseError) {
                    logger.info(`None of the retry strategies could work with the received error. Throwing it.`);
                    throw responseError;
                }
                if (response) {
                    logger.info(`None of the retry strategies could work with the received response. Returning it.`);
                    return response;
                }
                // If all the retries skip and there's no response,
                // we're still in the retry loop, so a new request will be sent
                // until `maxRetries` is reached.
            }
        },
    };
}

// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.
/**
 * Name of the {@link defaultRetryPolicy}
 */
const defaultRetryPolicyName = "defaultRetryPolicy";
/**
 * A policy that retries according to three strategies:
 * - When the server sends a 429 response with a Retry-After header.
 * - When there are errors in the underlying transport layer (e.g. DNS lookup failures).
 * - Or otherwise if the outgoing request fails, it will retry with an exponentially increasing delay.
 */
function defaultRetryPolicy$1(options = {}) {
    var _a;
    return {
        name: defaultRetryPolicyName,
        sendRequest: retryPolicy([throttlingRetryStrategy(), exponentialRetryStrategy(options)], {
            maxRetries: (_a = options.maxRetries) !== null && _a !== void 0 ? _a : DEFAULT_RETRY_POLICY_COUNT,
        }).sendRequest,
    };
}

// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.
var _a, _b, _c, _d;
/**
 * A constant that indicates whether the environment the code is running is a Web Worker.
 */
typeof self === "object" &&
    typeof (self === null || self === void 0 ? void 0 : self.importScripts) === "function" &&
    (((_a = self.constructor) === null || _a === void 0 ? void 0 : _a.name) === "DedicatedWorkerGlobalScope" ||
        ((_b = self.constructor) === null || _b === void 0 ? void 0 : _b.name) === "ServiceWorkerGlobalScope" ||
        ((_c = self.constructor) === null || _c === void 0 ? void 0 : _c.name) === "SharedWorkerGlobalScope");
/**
 * A constant that indicates whether the environment the code is running is Deno.
 */
typeof Deno !== "undefined" &&
    typeof Deno.version !== "undefined" &&
    typeof Deno.version.deno !== "undefined";
/**
 * A constant that indicates whether the environment the code is running is Bun.sh.
 */
typeof Bun !== "undefined" && typeof Bun.version !== "undefined";
/**
 * A constant that indicates whether the environment the code is running is a Node.js compatible environment.
 */
const isNodeLike$1 = typeof globalThis.process !== "undefined" &&
    Boolean(globalThis.process.version) &&
    Boolean((_d = globalThis.process.versions) === null || _d === void 0 ? void 0 : _d.node);

// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.
/**
 * The programmatic identifier of the formDataPolicy.
 */
const formDataPolicyName = "formDataPolicy";
function formDataToFormDataMap(formData) {
    var _a;
    const formDataMap = {};
    for (const [key, value] of formData.entries()) {
        (_a = formDataMap[key]) !== null && _a !== void 0 ? _a : (formDataMap[key] = []);
        formDataMap[key].push(value);
    }
    return formDataMap;
}
/**
 * A policy that encodes FormData on the request into the body.
 */
function formDataPolicy$1() {
    return {
        name: formDataPolicyName,
        async sendRequest(request, next) {
            if (isNodeLike$1 && typeof FormData !== "undefined" && request.body instanceof FormData) {
                request.formData = formDataToFormDataMap(request.body);
                request.body = undefined;
            }
            if (request.formData) {
                const contentType = request.headers.get("Content-Type");
                if (contentType && contentType.indexOf("application/x-www-form-urlencoded") !== -1) {
                    request.body = wwwFormUrlEncode(request.formData);
                }
                else {
                    await prepareFormData(request.formData, request);
                }
                request.formData = undefined;
            }
            return next(request);
        },
    };
}
function wwwFormUrlEncode(formData) {
    const urlSearchParams = new URLSearchParams();
    for (const [key, value] of Object.entries(formData)) {
        if (Array.isArray(value)) {
            for (const subValue of value) {
                urlSearchParams.append(key, subValue.toString());
            }
        }
        else {
            urlSearchParams.append(key, value.toString());
        }
    }
    return urlSearchParams.toString();
}
async function prepareFormData(formData, request) {
    // validate content type (multipart/form-data)
    const contentType = request.headers.get("Content-Type");
    if (contentType && !contentType.startsWith("multipart/form-data")) {
        // content type is specified and is not multipart/form-data. Exit.
        return;
    }
    request.headers.set("Content-Type", contentType !== null && contentType !== void 0 ? contentType : "multipart/form-data");
    // set body to MultipartRequestBody using content from FormDataMap
    const parts = [];
    for (const [fieldName, values] of Object.entries(formData)) {
        for (const value of Array.isArray(values) ? values : [values]) {
            if (typeof value === "string") {
                parts.push({
                    headers: createHttpHeaders({
                        "Content-Disposition": `form-data; name="${fieldName}"`,
                    }),
                    body: stringToUint8Array(value, "utf-8"),
                });
            }
            else if (value === undefined || value === null || typeof value !== "object") {
                throw new Error(`Unexpected value for key ${fieldName}: ${value}. Value should be serialized to string first.`);
            }
            else {
                // using || instead of ?? here since if value.name is empty we should create a file name
                const fileName = value.name || "blob";
                const headers = createHttpHeaders();
                headers.set("Content-Disposition", `form-data; name="${fieldName}"; filename="${fileName}"`);
                // again, || is used since an empty value.type means the content type is unset
                headers.set("Content-Type", value.type || "application/octet-stream");
                parts.push({
                    headers,
                    body: value,
                });
            }
        }
    }
    request.multipartBody = { parts };
}

var dist$2 = {};

var src = {exports: {}};

var browser = {exports: {}};

/**
 * Helpers.
 */

var ms;
var hasRequiredMs;

function requireMs () {
	if (hasRequiredMs) return ms;
	hasRequiredMs = 1;
	var s = 1000;
	var m = s * 60;
	var h = m * 60;
	var d = h * 24;
	var w = d * 7;
	var y = d * 365.25;

	/**
	 * Parse or format the given `val`.
	 *
	 * Options:
	 *
	 *  - `long` verbose formatting [false]
	 *
	 * @param {String|Number} val
	 * @param {Object} [options]
	 * @throws {Error} throw an error if val is not a non-empty string or a number
	 * @return {String|Number}
	 * @api public
	 */

	ms = function (val, options) {
	  options = options || {};
	  var type = typeof val;
	  if (type === 'string' && val.length > 0) {
	    return parse(val);
	  } else if (type === 'number' && isFinite(val)) {
	    return options.long ? fmtLong(val) : fmtShort(val);
	  }
	  throw new Error(
	    'val is not a non-empty string or a valid number. val=' +
	      JSON.stringify(val)
	  );
	};

	/**
	 * Parse the given `str` and return milliseconds.
	 *
	 * @param {String} str
	 * @return {Number}
	 * @api private
	 */

	function parse(str) {
	  str = String(str);
	  if (str.length > 100) {
	    return;
	  }
	  var match = /^(-?(?:\d+)?\.?\d+) *(milliseconds?|msecs?|ms|seconds?|secs?|s|minutes?|mins?|m|hours?|hrs?|h|days?|d|weeks?|w|years?|yrs?|y)?$/i.exec(
	    str
	  );
	  if (!match) {
	    return;
	  }
	  var n = parseFloat(match[1]);
	  var type = (match[2] || 'ms').toLowerCase();
	  switch (type) {
	    case 'years':
	    case 'year':
	    case 'yrs':
	    case 'yr':
	    case 'y':
	      return n * y;
	    case 'weeks':
	    case 'week':
	    case 'w':
	      return n * w;
	    case 'days':
	    case 'day':
	    case 'd':
	      return n * d;
	    case 'hours':
	    case 'hour':
	    case 'hrs':
	    case 'hr':
	    case 'h':
	      return n * h;
	    case 'minutes':
	    case 'minute':
	    case 'mins':
	    case 'min':
	    case 'm':
	      return n * m;
	    case 'seconds':
	    case 'second':
	    case 'secs':
	    case 'sec':
	    case 's':
	      return n * s;
	    case 'milliseconds':
	    case 'millisecond':
	    case 'msecs':
	    case 'msec':
	    case 'ms':
	      return n;
	    default:
	      return undefined;
	  }
	}

	/**
	 * Short format for `ms`.
	 *
	 * @param {Number} ms
	 * @return {String}
	 * @api private
	 */

	function fmtShort(ms) {
	  var msAbs = Math.abs(ms);
	  if (msAbs >= d) {
	    return Math.round(ms / d) + 'd';
	  }
	  if (msAbs >= h) {
	    return Math.round(ms / h) + 'h';
	  }
	  if (msAbs >= m) {
	    return Math.round(ms / m) + 'm';
	  }
	  if (msAbs >= s) {
	    return Math.round(ms / s) + 's';
	  }
	  return ms + 'ms';
	}

	/**
	 * Long format for `ms`.
	 *
	 * @param {Number} ms
	 * @return {String}
	 * @api private
	 */

	function fmtLong(ms) {
	  var msAbs = Math.abs(ms);
	  if (msAbs >= d) {
	    return plural(ms, msAbs, d, 'day');
	  }
	  if (msAbs >= h) {
	    return plural(ms, msAbs, h, 'hour');
	  }
	  if (msAbs >= m) {
	    return plural(ms, msAbs, m, 'minute');
	  }
	  if (msAbs >= s) {
	    return plural(ms, msAbs, s, 'second');
	  }
	  return ms + ' ms';
	}

	/**
	 * Pluralization helper.
	 */

	function plural(ms, msAbs, n, name) {
	  var isPlural = msAbs >= n * 1.5;
	  return Math.round(ms / n) + ' ' + name + (isPlural ? 's' : '');
	}
	return ms;
}

var common;
var hasRequiredCommon;

function requireCommon () {
	if (hasRequiredCommon) return common;
	hasRequiredCommon = 1;
	/**
	 * This is the common logic for both the Node.js and web browser
	 * implementations of `debug()`.
	 */

	function setup(env) {
		createDebug.debug = createDebug;
		createDebug.default = createDebug;
		createDebug.coerce = coerce;
		createDebug.disable = disable;
		createDebug.enable = enable;
		createDebug.enabled = enabled;
		createDebug.humanize = requireMs();
		createDebug.destroy = destroy;

		Object.keys(env).forEach(key => {
			createDebug[key] = env[key];
		});

		/**
		* The currently active debug mode names, and names to skip.
		*/

		createDebug.names = [];
		createDebug.skips = [];

		/**
		* Map of special "%n" handling functions, for the debug "format" argument.
		*
		* Valid key names are a single, lower or upper-case letter, i.e. "n" and "N".
		*/
		createDebug.formatters = {};

		/**
		* Selects a color for a debug namespace
		* @param {String} namespace The namespace string for the debug instance to be colored
		* @return {Number|String} An ANSI color code for the given namespace
		* @api private
		*/
		function selectColor(namespace) {
			let hash = 0;

			for (let i = 0; i < namespace.length; i++) {
				hash = ((hash << 5) - hash) + namespace.charCodeAt(i);
				hash |= 0; // Convert to 32bit integer
			}

			return createDebug.colors[Math.abs(hash) % createDebug.colors.length];
		}
		createDebug.selectColor = selectColor;

		/**
		* Create a debugger with the given `namespace`.
		*
		* @param {String} namespace
		* @return {Function}
		* @api public
		*/
		function createDebug(namespace) {
			let prevTime;
			let enableOverride = null;
			let namespacesCache;
			let enabledCache;

			function debug(...args) {
				// Disabled?
				if (!debug.enabled) {
					return;
				}

				const self = debug;

				// Set `diff` timestamp
				const curr = Number(new Date());
				const ms = curr - (prevTime || curr);
				self.diff = ms;
				self.prev = prevTime;
				self.curr = curr;
				prevTime = curr;

				args[0] = createDebug.coerce(args[0]);

				if (typeof args[0] !== 'string') {
					// Anything else let's inspect with %O
					args.unshift('%O');
				}

				// Apply any `formatters` transformations
				let index = 0;
				args[0] = args[0].replace(/%([a-zA-Z%])/g, (match, format) => {
					// If we encounter an escaped % then don't increase the array index
					if (match === '%%') {
						return '%';
					}
					index++;
					const formatter = createDebug.formatters[format];
					if (typeof formatter === 'function') {
						const val = args[index];
						match = formatter.call(self, val);

						// Now we need to remove `args[index]` since it's inlined in the `format`
						args.splice(index, 1);
						index--;
					}
					return match;
				});

				// Apply env-specific formatting (colors, etc.)
				createDebug.formatArgs.call(self, args);

				const logFn = self.log || createDebug.log;
				logFn.apply(self, args);
			}

			debug.namespace = namespace;
			debug.useColors = createDebug.useColors();
			debug.color = createDebug.selectColor(namespace);
			debug.extend = extend;
			debug.destroy = createDebug.destroy; // XXX Temporary. Will be removed in the next major release.

			Object.defineProperty(debug, 'enabled', {
				enumerable: true,
				configurable: false,
				get: () => {
					if (enableOverride !== null) {
						return enableOverride;
					}
					if (namespacesCache !== createDebug.namespaces) {
						namespacesCache = createDebug.namespaces;
						enabledCache = createDebug.enabled(namespace);
					}

					return enabledCache;
				},
				set: v => {
					enableOverride = v;
				}
			});

			// Env-specific initialization logic for debug instances
			if (typeof createDebug.init === 'function') {
				createDebug.init(debug);
			}

			return debug;
		}

		function extend(namespace, delimiter) {
			const newDebug = createDebug(this.namespace + (typeof delimiter === 'undefined' ? ':' : delimiter) + namespace);
			newDebug.log = this.log;
			return newDebug;
		}

		/**
		* Enables a debug mode by namespaces. This can include modes
		* separated by a colon and wildcards.
		*
		* @param {String} namespaces
		* @api public
		*/
		function enable(namespaces) {
			createDebug.save(namespaces);
			createDebug.namespaces = namespaces;

			createDebug.names = [];
			createDebug.skips = [];

			const split = (typeof namespaces === 'string' ? namespaces : '')
				.trim()
				.replace(/\s+/g, ',')
				.split(',')
				.filter(Boolean);

			for (const ns of split) {
				if (ns[0] === '-') {
					createDebug.skips.push(ns.slice(1));
				} else {
					createDebug.names.push(ns);
				}
			}
		}

		/**
		 * Checks if the given string matches a namespace template, honoring
		 * asterisks as wildcards.
		 *
		 * @param {String} search
		 * @param {String} template
		 * @return {Boolean}
		 */
		function matchesTemplate(search, template) {
			let searchIndex = 0;
			let templateIndex = 0;
			let starIndex = -1;
			let matchIndex = 0;

			while (searchIndex < search.length) {
				if (templateIndex < template.length && (template[templateIndex] === search[searchIndex] || template[templateIndex] === '*')) {
					// Match character or proceed with wildcard
					if (template[templateIndex] === '*') {
						starIndex = templateIndex;
						matchIndex = searchIndex;
						templateIndex++; // Skip the '*'
					} else {
						searchIndex++;
						templateIndex++;
					}
				} else if (starIndex !== -1) { // eslint-disable-line no-negated-condition
					// Backtrack to the last '*' and try to match more characters
					templateIndex = starIndex + 1;
					matchIndex++;
					searchIndex = matchIndex;
				} else {
					return false; // No match
				}
			}

			// Handle trailing '*' in template
			while (templateIndex < template.length && template[templateIndex] === '*') {
				templateIndex++;
			}

			return templateIndex === template.length;
		}

		/**
		* Disable debug output.
		*
		* @return {String} namespaces
		* @api public
		*/
		function disable() {
			const namespaces = [
				...createDebug.names,
				...createDebug.skips.map(namespace => '-' + namespace)
			].join(',');
			createDebug.enable('');
			return namespaces;
		}

		/**
		* Returns true if the given mode name is enabled, false otherwise.
		*
		* @param {String} name
		* @return {Boolean}
		* @api public
		*/
		function enabled(name) {
			for (const skip of createDebug.skips) {
				if (matchesTemplate(name, skip)) {
					return false;
				}
			}

			for (const ns of createDebug.names) {
				if (matchesTemplate(name, ns)) {
					return true;
				}
			}

			return false;
		}

		/**
		* Coerce `val`.
		*
		* @param {Mixed} val
		* @return {Mixed}
		* @api private
		*/
		function coerce(val) {
			if (val instanceof Error) {
				return val.stack || val.message;
			}
			return val;
		}

		/**
		* XXX DO NOT USE. This is a temporary stub function.
		* XXX It WILL be removed in the next major release.
		*/
		function destroy() {
			console.warn('Instance method `debug.destroy()` is deprecated and no longer does anything. It will be removed in the next major version of `debug`.');
		}

		createDebug.enable(createDebug.load());

		return createDebug;
	}

	common = setup;
	return common;
}

/* eslint-env browser */

var hasRequiredBrowser;

function requireBrowser () {
	if (hasRequiredBrowser) return browser.exports;
	hasRequiredBrowser = 1;
	(function (module, exports) {
		/**
		 * This is the web browser implementation of `debug()`.
		 */

		exports.formatArgs = formatArgs;
		exports.save = save;
		exports.load = load;
		exports.useColors = useColors;
		exports.storage = localstorage();
		exports.destroy = (() => {
			let warned = false;

			return () => {
				if (!warned) {
					warned = true;
					console.warn('Instance method `debug.destroy()` is deprecated and no longer does anything. It will be removed in the next major version of `debug`.');
				}
			};
		})();

		/**
		 * Colors.
		 */

		exports.colors = [
			'#0000CC',
			'#0000FF',
			'#0033CC',
			'#0033FF',
			'#0066CC',
			'#0066FF',
			'#0099CC',
			'#0099FF',
			'#00CC00',
			'#00CC33',
			'#00CC66',
			'#00CC99',
			'#00CCCC',
			'#00CCFF',
			'#3300CC',
			'#3300FF',
			'#3333CC',
			'#3333FF',
			'#3366CC',
			'#3366FF',
			'#3399CC',
			'#3399FF',
			'#33CC00',
			'#33CC33',
			'#33CC66',
			'#33CC99',
			'#33CCCC',
			'#33CCFF',
			'#6600CC',
			'#6600FF',
			'#6633CC',
			'#6633FF',
			'#66CC00',
			'#66CC33',
			'#9900CC',
			'#9900FF',
			'#9933CC',
			'#9933FF',
			'#99CC00',
			'#99CC33',
			'#CC0000',
			'#CC0033',
			'#CC0066',
			'#CC0099',
			'#CC00CC',
			'#CC00FF',
			'#CC3300',
			'#CC3333',
			'#CC3366',
			'#CC3399',
			'#CC33CC',
			'#CC33FF',
			'#CC6600',
			'#CC6633',
			'#CC9900',
			'#CC9933',
			'#CCCC00',
			'#CCCC33',
			'#FF0000',
			'#FF0033',
			'#FF0066',
			'#FF0099',
			'#FF00CC',
			'#FF00FF',
			'#FF3300',
			'#FF3333',
			'#FF3366',
			'#FF3399',
			'#FF33CC',
			'#FF33FF',
			'#FF6600',
			'#FF6633',
			'#FF9900',
			'#FF9933',
			'#FFCC00',
			'#FFCC33'
		];

		/**
		 * Currently only WebKit-based Web Inspectors, Firefox >= v31,
		 * and the Firebug extension (any Firefox version) are known
		 * to support "%c" CSS customizations.
		 *
		 * TODO: add a `localStorage` variable to explicitly enable/disable colors
		 */

		// eslint-disable-next-line complexity
		function useColors() {
			// NB: In an Electron preload script, document will be defined but not fully
			// initialized. Since we know we're in Chrome, we'll just detect this case
			// explicitly
			if (typeof window !== 'undefined' && window.process && (window.process.type === 'renderer' || window.process.__nwjs)) {
				return true;
			}

			// Internet Explorer and Edge do not support colors.
			if (typeof navigator !== 'undefined' && navigator.userAgent && navigator.userAgent.toLowerCase().match(/(edge|trident)\/(\d+)/)) {
				return false;
			}

			let m;

			// Is webkit? http://stackoverflow.com/a/16459606/376773
			// document is undefined in react-native: https://github.com/facebook/react-native/pull/1632
			// eslint-disable-next-line no-return-assign
			return (typeof document !== 'undefined' && document.documentElement && document.documentElement.style && document.documentElement.style.WebkitAppearance) ||
				// Is firebug? http://stackoverflow.com/a/398120/376773
				(typeof window !== 'undefined' && window.console && (window.console.firebug || (window.console.exception && window.console.table))) ||
				// Is firefox >= v31?
				// https://developer.mozilla.org/en-US/docs/Tools/Web_Console#Styling_messages
				(typeof navigator !== 'undefined' && navigator.userAgent && (m = navigator.userAgent.toLowerCase().match(/firefox\/(\d+)/)) && parseInt(m[1], 10) >= 31) ||
				// Double check webkit in userAgent just in case we are in a worker
				(typeof navigator !== 'undefined' && navigator.userAgent && navigator.userAgent.toLowerCase().match(/applewebkit\/(\d+)/));
		}

		/**
		 * Colorize log arguments if enabled.
		 *
		 * @api public
		 */

		function formatArgs(args) {
			args[0] = (this.useColors ? '%c' : '') +
				this.namespace +
				(this.useColors ? ' %c' : ' ') +
				args[0] +
				(this.useColors ? '%c ' : ' ') +
				'+' + module.exports.humanize(this.diff);

			if (!this.useColors) {
				return;
			}

			const c = 'color: ' + this.color;
			args.splice(1, 0, c, 'color: inherit');

			// The final "%c" is somewhat tricky, because there could be other
			// arguments passed either before or after the %c, so we need to
			// figure out the correct index to insert the CSS into
			let index = 0;
			let lastC = 0;
			args[0].replace(/%[a-zA-Z%]/g, match => {
				if (match === '%%') {
					return;
				}
				index++;
				if (match === '%c') {
					// We only are interested in the *last* %c
					// (the user may have provided their own)
					lastC = index;
				}
			});

			args.splice(lastC, 0, c);
		}

		/**
		 * Invokes `console.debug()` when available.
		 * No-op when `console.debug` is not a "function".
		 * If `console.debug` is not available, falls back
		 * to `console.log`.
		 *
		 * @api public
		 */
		exports.log = console.debug || console.log || (() => {});

		/**
		 * Save `namespaces`.
		 *
		 * @param {String} namespaces
		 * @api private
		 */
		function save(namespaces) {
			try {
				if (namespaces) {
					exports.storage.setItem('debug', namespaces);
				} else {
					exports.storage.removeItem('debug');
				}
			} catch (error) {
				// Swallow
				// XXX (@Qix-) should we be logging these?
			}
		}

		/**
		 * Load `namespaces`.
		 *
		 * @return {String} returns the previously persisted debug modes
		 * @api private
		 */
		function load() {
			let r;
			try {
				r = exports.storage.getItem('debug') || exports.storage.getItem('DEBUG') ;
			} catch (error) {
				// Swallow
				// XXX (@Qix-) should we be logging these?
			}

			// If debug isn't set in LS, and we're in Electron, try to load $DEBUG
			if (!r && typeof process !== 'undefined' && 'env' in process) {
				r = process.env.DEBUG;
			}

			return r;
		}

		/**
		 * Localstorage attempts to return the localstorage.
		 *
		 * This is necessary because safari throws
		 * when a user disables cookies/localstorage
		 * and you attempt to access it.
		 *
		 * @return {LocalStorage}
		 * @api private
		 */

		function localstorage() {
			try {
				// TVMLKit (Apple TV JS Runtime) does not have a window object, just localStorage in the global context
				// The Browser also has localStorage in the global context.
				return localStorage;
			} catch (error) {
				// Swallow
				// XXX (@Qix-) should we be logging these?
			}
		}

		module.exports = requireCommon()(exports);

		const {formatters} = module.exports;

		/**
		 * Map %j to `JSON.stringify()`, since no Web Inspectors do that by default.
		 */

		formatters.j = function (v) {
			try {
				return JSON.stringify(v);
			} catch (error) {
				return '[UnexpectedJSONParseError]: ' + error.message;
			}
		}; 
	} (browser, browser.exports));
	return browser.exports;
}

var node = {exports: {}};

var hasFlag;
var hasRequiredHasFlag;

function requireHasFlag () {
	if (hasRequiredHasFlag) return hasFlag;
	hasRequiredHasFlag = 1;

	hasFlag = (flag, argv = process.argv) => {
		const prefix = flag.startsWith('-') ? '' : (flag.length === 1 ? '-' : '--');
		const position = argv.indexOf(prefix + flag);
		const terminatorPosition = argv.indexOf('--');
		return position !== -1 && (terminatorPosition === -1 || position < terminatorPosition);
	};
	return hasFlag;
}

var supportsColor_1;
var hasRequiredSupportsColor;

function requireSupportsColor () {
	if (hasRequiredSupportsColor) return supportsColor_1;
	hasRequiredSupportsColor = 1;
	const os = require$$0__default;
	const tty = require$$1;
	const hasFlag = requireHasFlag();

	const {env} = process;

	let forceColor;
	if (hasFlag('no-color') ||
		hasFlag('no-colors') ||
		hasFlag('color=false') ||
		hasFlag('color=never')) {
		forceColor = 0;
	} else if (hasFlag('color') ||
		hasFlag('colors') ||
		hasFlag('color=true') ||
		hasFlag('color=always')) {
		forceColor = 1;
	}

	if ('FORCE_COLOR' in env) {
		if (env.FORCE_COLOR === 'true') {
			forceColor = 1;
		} else if (env.FORCE_COLOR === 'false') {
			forceColor = 0;
		} else {
			forceColor = env.FORCE_COLOR.length === 0 ? 1 : Math.min(parseInt(env.FORCE_COLOR, 10), 3);
		}
	}

	function translateLevel(level) {
		if (level === 0) {
			return false;
		}

		return {
			level,
			hasBasic: true,
			has256: level >= 2,
			has16m: level >= 3
		};
	}

	function supportsColor(haveStream, streamIsTTY) {
		if (forceColor === 0) {
			return 0;
		}

		if (hasFlag('color=16m') ||
			hasFlag('color=full') ||
			hasFlag('color=truecolor')) {
			return 3;
		}

		if (hasFlag('color=256')) {
			return 2;
		}

		if (haveStream && !streamIsTTY && forceColor === undefined) {
			return 0;
		}

		const min = forceColor || 0;

		if (env.TERM === 'dumb') {
			return min;
		}

		if (process.platform === 'win32') {
			// Windows 10 build 10586 is the first Windows release that supports 256 colors.
			// Windows 10 build 14931 is the first release that supports 16m/TrueColor.
			const osRelease = os.release().split('.');
			if (
				Number(osRelease[0]) >= 10 &&
				Number(osRelease[2]) >= 10586
			) {
				return Number(osRelease[2]) >= 14931 ? 3 : 2;
			}

			return 1;
		}

		if ('CI' in env) {
			if (['TRAVIS', 'CIRCLECI', 'APPVEYOR', 'GITLAB_CI', 'GITHUB_ACTIONS', 'BUILDKITE'].some(sign => sign in env) || env.CI_NAME === 'codeship') {
				return 1;
			}

			return min;
		}

		if ('TEAMCITY_VERSION' in env) {
			return /^(9\.(0*[1-9]\d*)\.|\d{2,}\.)/.test(env.TEAMCITY_VERSION) ? 1 : 0;
		}

		if (env.COLORTERM === 'truecolor') {
			return 3;
		}

		if ('TERM_PROGRAM' in env) {
			const version = parseInt((env.TERM_PROGRAM_VERSION || '').split('.')[0], 10);

			switch (env.TERM_PROGRAM) {
				case 'iTerm.app':
					return version >= 3 ? 3 : 2;
				case 'Apple_Terminal':
					return 2;
				// No default
			}
		}

		if (/-256(color)?$/i.test(env.TERM)) {
			return 2;
		}

		if (/^screen|^xterm|^vt100|^vt220|^rxvt|color|ansi|cygwin|linux/i.test(env.TERM)) {
			return 1;
		}

		if ('COLORTERM' in env) {
			return 1;
		}

		return min;
	}

	function getSupportLevel(stream) {
		const level = supportsColor(stream, stream && stream.isTTY);
		return translateLevel(level);
	}

	supportsColor_1 = {
		supportsColor: getSupportLevel,
		stdout: translateLevel(supportsColor(true, tty.isatty(1))),
		stderr: translateLevel(supportsColor(true, tty.isatty(2)))
	};
	return supportsColor_1;
}

/**
 * Module dependencies.
 */

var hasRequiredNode;

function requireNode () {
	if (hasRequiredNode) return node.exports;
	hasRequiredNode = 1;
	(function (module, exports) {
		const tty = require$$1;
		const util = require$$1$1;

		/**
		 * This is the Node.js implementation of `debug()`.
		 */

		exports.init = init;
		exports.log = log;
		exports.formatArgs = formatArgs;
		exports.save = save;
		exports.load = load;
		exports.useColors = useColors;
		exports.destroy = util.deprecate(
			() => {},
			'Instance method `debug.destroy()` is deprecated and no longer does anything. It will be removed in the next major version of `debug`.'
		);

		/**
		 * Colors.
		 */

		exports.colors = [6, 2, 3, 4, 5, 1];

		try {
			// Optional dependency (as in, doesn't need to be installed, NOT like optionalDependencies in package.json)
			// eslint-disable-next-line import/no-extraneous-dependencies
			const supportsColor = requireSupportsColor();

			if (supportsColor && (supportsColor.stderr || supportsColor).level >= 2) {
				exports.colors = [
					20,
					21,
					26,
					27,
					32,
					33,
					38,
					39,
					40,
					41,
					42,
					43,
					44,
					45,
					56,
					57,
					62,
					63,
					68,
					69,
					74,
					75,
					76,
					77,
					78,
					79,
					80,
					81,
					92,
					93,
					98,
					99,
					112,
					113,
					128,
					129,
					134,
					135,
					148,
					149,
					160,
					161,
					162,
					163,
					164,
					165,
					166,
					167,
					168,
					169,
					170,
					171,
					172,
					173,
					178,
					179,
					184,
					185,
					196,
					197,
					198,
					199,
					200,
					201,
					202,
					203,
					204,
					205,
					206,
					207,
					208,
					209,
					214,
					215,
					220,
					221
				];
			}
		} catch (error) {
			// Swallow - we only care if `supports-color` is available; it doesn't have to be.
		}

		/**
		 * Build up the default `inspectOpts` object from the environment variables.
		 *
		 *   $ DEBUG_COLORS=no DEBUG_DEPTH=10 DEBUG_SHOW_HIDDEN=enabled node script.js
		 */

		exports.inspectOpts = Object.keys(process.env).filter(key => {
			return /^debug_/i.test(key);
		}).reduce((obj, key) => {
			// Camel-case
			const prop = key
				.substring(6)
				.toLowerCase()
				.replace(/_([a-z])/g, (_, k) => {
					return k.toUpperCase();
				});

			// Coerce string value into JS value
			let val = process.env[key];
			if (/^(yes|on|true|enabled)$/i.test(val)) {
				val = true;
			} else if (/^(no|off|false|disabled)$/i.test(val)) {
				val = false;
			} else if (val === 'null') {
				val = null;
			} else {
				val = Number(val);
			}

			obj[prop] = val;
			return obj;
		}, {});

		/**
		 * Is stdout a TTY? Colored output is enabled when `true`.
		 */

		function useColors() {
			return 'colors' in exports.inspectOpts ?
				Boolean(exports.inspectOpts.colors) :
				tty.isatty(process.stderr.fd);
		}

		/**
		 * Adds ANSI color escape codes if enabled.
		 *
		 * @api public
		 */

		function formatArgs(args) {
			const {namespace: name, useColors} = this;

			if (useColors) {
				const c = this.color;
				const colorCode = '\u001B[3' + (c < 8 ? c : '8;5;' + c);
				const prefix = `  ${colorCode};1m${name} \u001B[0m`;

				args[0] = prefix + args[0].split('\n').join('\n' + prefix);
				args.push(colorCode + 'm+' + module.exports.humanize(this.diff) + '\u001B[0m');
			} else {
				args[0] = getDate() + name + ' ' + args[0];
			}
		}

		function getDate() {
			if (exports.inspectOpts.hideDate) {
				return '';
			}
			return new Date().toISOString() + ' ';
		}

		/**
		 * Invokes `util.formatWithOptions()` with the specified arguments and writes to stderr.
		 */

		function log(...args) {
			return process.stderr.write(util.formatWithOptions(exports.inspectOpts, ...args) + '\n');
		}

		/**
		 * Save `namespaces`.
		 *
		 * @param {String} namespaces
		 * @api private
		 */
		function save(namespaces) {
			if (namespaces) {
				process.env.DEBUG = namespaces;
			} else {
				// If you set a process.env field to null or undefined, it gets cast to the
				// string 'null' or 'undefined'. Just delete instead.
				delete process.env.DEBUG;
			}
		}

		/**
		 * Load `namespaces`.
		 *
		 * @return {String} returns the previously persisted debug modes
		 * @api private
		 */

		function load() {
			return process.env.DEBUG;
		}

		/**
		 * Init logic for `debug` instances.
		 *
		 * Create a new `inspectOpts` object in case `useColors` is set
		 * differently for a particular `debug` instance.
		 */

		function init(debug) {
			debug.inspectOpts = {};

			const keys = Object.keys(exports.inspectOpts);
			for (let i = 0; i < keys.length; i++) {
				debug.inspectOpts[keys[i]] = exports.inspectOpts[keys[i]];
			}
		}

		module.exports = requireCommon()(exports);

		const {formatters} = module.exports;

		/**
		 * Map %o to `util.inspect()`, all on a single line.
		 */

		formatters.o = function (v) {
			this.inspectOpts.colors = this.useColors;
			return util.inspect(v, this.inspectOpts)
				.split('\n')
				.map(str => str.trim())
				.join(' ');
		};

		/**
		 * Map %O to `util.inspect()`, allowing multiple lines if needed.
		 */

		formatters.O = function (v) {
			this.inspectOpts.colors = this.useColors;
			return util.inspect(v, this.inspectOpts);
		}; 
	} (node, node.exports));
	return node.exports;
}

/**
 * Detect Electron renderer / nwjs process, which is node, but we should
 * treat as a browser.
 */

var hasRequiredSrc;

function requireSrc () {
	if (hasRequiredSrc) return src.exports;
	hasRequiredSrc = 1;
	if (typeof process === 'undefined' || process.type === 'renderer' || process.browser === true || process.__nwjs) {
		src.exports = requireBrowser();
	} else {
		src.exports = requireNode();
	}
	return src.exports;
}

var dist$1 = {};

var helpers = {};

var hasRequiredHelpers;

function requireHelpers () {
	if (hasRequiredHelpers) return helpers;
	hasRequiredHelpers = 1;
	var __createBinding = (helpers && helpers.__createBinding) || (Object.create ? (function(o, m, k, k2) {
	    if (k2 === undefined) k2 = k;
	    var desc = Object.getOwnPropertyDescriptor(m, k);
	    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
	      desc = { enumerable: true, get: function() { return m[k]; } };
	    }
	    Object.defineProperty(o, k2, desc);
	}) : (function(o, m, k, k2) {
	    if (k2 === undefined) k2 = k;
	    o[k2] = m[k];
	}));
	var __setModuleDefault = (helpers && helpers.__setModuleDefault) || (Object.create ? (function(o, v) {
	    Object.defineProperty(o, "default", { enumerable: true, value: v });
	}) : function(o, v) {
	    o["default"] = v;
	});
	var __importStar = (helpers && helpers.__importStar) || function (mod) {
	    if (mod && mod.__esModule) return mod;
	    var result = {};
	    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
	    __setModuleDefault(result, mod);
	    return result;
	};
	Object.defineProperty(helpers, "__esModule", { value: true });
	helpers.req = helpers.json = helpers.toBuffer = void 0;
	const http = __importStar(require$$0$1);
	const https = __importStar(require$$1$2);
	async function toBuffer(stream) {
	    let length = 0;
	    const chunks = [];
	    for await (const chunk of stream) {
	        length += chunk.length;
	        chunks.push(chunk);
	    }
	    return Buffer.concat(chunks, length);
	}
	helpers.toBuffer = toBuffer;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	async function json(stream) {
	    const buf = await toBuffer(stream);
	    const str = buf.toString('utf8');
	    try {
	        return JSON.parse(str);
	    }
	    catch (_err) {
	        const err = _err;
	        err.message += ` (input: ${str})`;
	        throw err;
	    }
	}
	helpers.json = json;
	function req(url, opts = {}) {
	    const href = typeof url === 'string' ? url : url.href;
	    const req = (href.startsWith('https:') ? https : http).request(url, opts);
	    const promise = new Promise((resolve, reject) => {
	        req
	            .once('response', resolve)
	            .once('error', reject)
	            .end();
	    });
	    req.then = promise.then.bind(promise);
	    return req;
	}
	helpers.req = req;
	
	return helpers;
}

var hasRequiredDist$2;

function requireDist$2 () {
	if (hasRequiredDist$2) return dist$1;
	hasRequiredDist$2 = 1;
	(function (exports) {
		var __createBinding = (dist$1 && dist$1.__createBinding) || (Object.create ? (function(o, m, k, k2) {
		    if (k2 === undefined) k2 = k;
		    var desc = Object.getOwnPropertyDescriptor(m, k);
		    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
		      desc = { enumerable: true, get: function() { return m[k]; } };
		    }
		    Object.defineProperty(o, k2, desc);
		}) : (function(o, m, k, k2) {
		    if (k2 === undefined) k2 = k;
		    o[k2] = m[k];
		}));
		var __setModuleDefault = (dist$1 && dist$1.__setModuleDefault) || (Object.create ? (function(o, v) {
		    Object.defineProperty(o, "default", { enumerable: true, value: v });
		}) : function(o, v) {
		    o["default"] = v;
		});
		var __importStar = (dist$1 && dist$1.__importStar) || function (mod) {
		    if (mod && mod.__esModule) return mod;
		    var result = {};
		    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
		    __setModuleDefault(result, mod);
		    return result;
		};
		var __exportStar = (dist$1 && dist$1.__exportStar) || function(m, exports) {
		    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
		};
		Object.defineProperty(exports, "__esModule", { value: true });
		exports.Agent = void 0;
		const net = __importStar(require$$0$2);
		const http = __importStar(require$$0$1);
		const https_1 = require$$1$2;
		__exportStar(requireHelpers(), exports);
		const INTERNAL = Symbol('AgentBaseInternalState');
		class Agent extends http.Agent {
		    constructor(opts) {
		        super(opts);
		        this[INTERNAL] = {};
		    }
		    /**
		     * Determine whether this is an `http` or `https` request.
		     */
		    isSecureEndpoint(options) {
		        if (options) {
		            // First check the `secureEndpoint` property explicitly, since this
		            // means that a parent `Agent` is "passing through" to this instance.
		            // eslint-disable-next-line @typescript-eslint/no-explicit-any
		            if (typeof options.secureEndpoint === 'boolean') {
		                return options.secureEndpoint;
		            }
		            // If no explicit `secure` endpoint, check if `protocol` property is
		            // set. This will usually be the case since using a full string URL
		            // or `URL` instance should be the most common usage.
		            if (typeof options.protocol === 'string') {
		                return options.protocol === 'https:';
		            }
		        }
		        // Finally, if no `protocol` property was set, then fall back to
		        // checking the stack trace of the current call stack, and try to
		        // detect the "https" module.
		        const { stack } = new Error();
		        if (typeof stack !== 'string')
		            return false;
		        return stack
		            .split('\n')
		            .some((l) => l.indexOf('(https.js:') !== -1 ||
		            l.indexOf('node:https:') !== -1);
		    }
		    // In order to support async signatures in `connect()` and Node's native
		    // connection pooling in `http.Agent`, the array of sockets for each origin
		    // has to be updated synchronously. This is so the length of the array is
		    // accurate when `addRequest()` is next called. We achieve this by creating a
		    // fake socket and adding it to `sockets[origin]` and incrementing
		    // `totalSocketCount`.
		    incrementSockets(name) {
		        // If `maxSockets` and `maxTotalSockets` are both Infinity then there is no
		        // need to create a fake socket because Node.js native connection pooling
		        // will never be invoked.
		        if (this.maxSockets === Infinity && this.maxTotalSockets === Infinity) {
		            return null;
		        }
		        // All instances of `sockets` are expected TypeScript errors. The
		        // alternative is to add it as a private property of this class but that
		        // will break TypeScript subclassing.
		        if (!this.sockets[name]) {
		            // @ts-expect-error `sockets` is readonly in `@types/node`
		            this.sockets[name] = [];
		        }
		        const fakeSocket = new net.Socket({ writable: false });
		        this.sockets[name].push(fakeSocket);
		        // @ts-expect-error `totalSocketCount` isn't defined in `@types/node`
		        this.totalSocketCount++;
		        return fakeSocket;
		    }
		    decrementSockets(name, socket) {
		        if (!this.sockets[name] || socket === null) {
		            return;
		        }
		        const sockets = this.sockets[name];
		        const index = sockets.indexOf(socket);
		        if (index !== -1) {
		            sockets.splice(index, 1);
		            // @ts-expect-error  `totalSocketCount` isn't defined in `@types/node`
		            this.totalSocketCount--;
		            if (sockets.length === 0) {
		                // @ts-expect-error `sockets` is readonly in `@types/node`
		                delete this.sockets[name];
		            }
		        }
		    }
		    // In order to properly update the socket pool, we need to call `getName()` on
		    // the core `https.Agent` if it is a secureEndpoint.
		    getName(options) {
		        const secureEndpoint = typeof options.secureEndpoint === 'boolean'
		            ? options.secureEndpoint
		            : this.isSecureEndpoint(options);
		        if (secureEndpoint) {
		            // @ts-expect-error `getName()` isn't defined in `@types/node`
		            return https_1.Agent.prototype.getName.call(this, options);
		        }
		        // @ts-expect-error `getName()` isn't defined in `@types/node`
		        return super.getName(options);
		    }
		    createSocket(req, options, cb) {
		        const connectOpts = {
		            ...options,
		            secureEndpoint: this.isSecureEndpoint(options),
		        };
		        const name = this.getName(connectOpts);
		        const fakeSocket = this.incrementSockets(name);
		        Promise.resolve()
		            .then(() => this.connect(req, connectOpts))
		            .then((socket) => {
		            this.decrementSockets(name, fakeSocket);
		            if (socket instanceof http.Agent) {
		                try {
		                    // @ts-expect-error `addRequest()` isn't defined in `@types/node`
		                    return socket.addRequest(req, connectOpts);
		                }
		                catch (err) {
		                    return cb(err);
		                }
		            }
		            this[INTERNAL].currentSocket = socket;
		            // @ts-expect-error `createSocket()` isn't defined in `@types/node`
		            super.createSocket(req, options, cb);
		        }, (err) => {
		            this.decrementSockets(name, fakeSocket);
		            cb(err);
		        });
		    }
		    createConnection() {
		        const socket = this[INTERNAL].currentSocket;
		        this[INTERNAL].currentSocket = undefined;
		        if (!socket) {
		            throw new Error('No socket was returned in the `connect()` function');
		        }
		        return socket;
		    }
		    get defaultPort() {
		        return (this[INTERNAL].defaultPort ??
		            (this.protocol === 'https:' ? 443 : 80));
		    }
		    set defaultPort(v) {
		        if (this[INTERNAL]) {
		            this[INTERNAL].defaultPort = v;
		        }
		    }
		    get protocol() {
		        return (this[INTERNAL].protocol ??
		            (this.isSecureEndpoint() ? 'https:' : 'http:'));
		    }
		    set protocol(v) {
		        if (this[INTERNAL]) {
		            this[INTERNAL].protocol = v;
		        }
		    }
		}
		exports.Agent = Agent;
		
	} (dist$1));
	return dist$1;
}

var parseProxyResponse = {};

var hasRequiredParseProxyResponse;

function requireParseProxyResponse () {
	if (hasRequiredParseProxyResponse) return parseProxyResponse;
	hasRequiredParseProxyResponse = 1;
	var __importDefault = (parseProxyResponse && parseProxyResponse.__importDefault) || function (mod) {
	    return (mod && mod.__esModule) ? mod : { "default": mod };
	};
	Object.defineProperty(parseProxyResponse, "__esModule", { value: true });
	parseProxyResponse.parseProxyResponse = void 0;
	const debug_1 = __importDefault(requireSrc());
	const debug = (0, debug_1.default)('https-proxy-agent:parse-proxy-response');
	function parseProxyResponse$1(socket) {
	    return new Promise((resolve, reject) => {
	        // we need to buffer any HTTP traffic that happens with the proxy before we get
	        // the CONNECT response, so that if the response is anything other than an "200"
	        // response code, then we can re-play the "data" events on the socket once the
	        // HTTP parser is hooked up...
	        let buffersLength = 0;
	        const buffers = [];
	        function read() {
	            const b = socket.read();
	            if (b)
	                ondata(b);
	            else
	                socket.once('readable', read);
	        }
	        function cleanup() {
	            socket.removeListener('end', onend);
	            socket.removeListener('error', onerror);
	            socket.removeListener('readable', read);
	        }
	        function onend() {
	            cleanup();
	            debug('onend');
	            reject(new Error('Proxy connection ended before receiving CONNECT response'));
	        }
	        function onerror(err) {
	            cleanup();
	            debug('onerror %o', err);
	            reject(err);
	        }
	        function ondata(b) {
	            buffers.push(b);
	            buffersLength += b.length;
	            const buffered = Buffer.concat(buffers, buffersLength);
	            const endOfHeaders = buffered.indexOf('\r\n\r\n');
	            if (endOfHeaders === -1) {
	                // keep buffering
	                debug('have not received end of HTTP headers yet...');
	                read();
	                return;
	            }
	            const headerParts = buffered
	                .slice(0, endOfHeaders)
	                .toString('ascii')
	                .split('\r\n');
	            const firstLine = headerParts.shift();
	            if (!firstLine) {
	                socket.destroy();
	                return reject(new Error('No header received from proxy CONNECT response'));
	            }
	            const firstLineParts = firstLine.split(' ');
	            const statusCode = +firstLineParts[1];
	            const statusText = firstLineParts.slice(2).join(' ');
	            const headers = {};
	            for (const header of headerParts) {
	                if (!header)
	                    continue;
	                const firstColon = header.indexOf(':');
	                if (firstColon === -1) {
	                    socket.destroy();
	                    return reject(new Error(`Invalid header from proxy CONNECT response: "${header}"`));
	                }
	                const key = header.slice(0, firstColon).toLowerCase();
	                const value = header.slice(firstColon + 1).trimStart();
	                const current = headers[key];
	                if (typeof current === 'string') {
	                    headers[key] = [current, value];
	                }
	                else if (Array.isArray(current)) {
	                    current.push(value);
	                }
	                else {
	                    headers[key] = value;
	                }
	            }
	            debug('got proxy server response: %o %o', firstLine, headers);
	            cleanup();
	            resolve({
	                connect: {
	                    statusCode,
	                    statusText,
	                    headers,
	                },
	                buffered,
	            });
	        }
	        socket.on('error', onerror);
	        socket.on('end', onend);
	        read();
	    });
	}
	parseProxyResponse.parseProxyResponse = parseProxyResponse$1;
	
	return parseProxyResponse;
}

var hasRequiredDist$1;

function requireDist$1 () {
	if (hasRequiredDist$1) return dist$2;
	hasRequiredDist$1 = 1;
	var __createBinding = (dist$2 && dist$2.__createBinding) || (Object.create ? (function(o, m, k, k2) {
	    if (k2 === undefined) k2 = k;
	    var desc = Object.getOwnPropertyDescriptor(m, k);
	    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
	      desc = { enumerable: true, get: function() { return m[k]; } };
	    }
	    Object.defineProperty(o, k2, desc);
	}) : (function(o, m, k, k2) {
	    if (k2 === undefined) k2 = k;
	    o[k2] = m[k];
	}));
	var __setModuleDefault = (dist$2 && dist$2.__setModuleDefault) || (Object.create ? (function(o, v) {
	    Object.defineProperty(o, "default", { enumerable: true, value: v });
	}) : function(o, v) {
	    o["default"] = v;
	});
	var __importStar = (dist$2 && dist$2.__importStar) || function (mod) {
	    if (mod && mod.__esModule) return mod;
	    var result = {};
	    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
	    __setModuleDefault(result, mod);
	    return result;
	};
	var __importDefault = (dist$2 && dist$2.__importDefault) || function (mod) {
	    return (mod && mod.__esModule) ? mod : { "default": mod };
	};
	Object.defineProperty(dist$2, "__esModule", { value: true });
	dist$2.HttpsProxyAgent = void 0;
	const net = __importStar(require$$0$2);
	const tls = __importStar(require$$1$3);
	const assert_1 = __importDefault(require$$2);
	const debug_1 = __importDefault(requireSrc());
	const agent_base_1 = requireDist$2();
	const url_1 = require$$5;
	const parse_proxy_response_1 = requireParseProxyResponse();
	const debug = (0, debug_1.default)('https-proxy-agent');
	const setServernameFromNonIpHost = (options) => {
	    if (options.servername === undefined &&
	        options.host &&
	        !net.isIP(options.host)) {
	        return {
	            ...options,
	            servername: options.host,
	        };
	    }
	    return options;
	};
	/**
	 * The `HttpsProxyAgent` implements an HTTP Agent subclass that connects to
	 * the specified "HTTP(s) proxy server" in order to proxy HTTPS requests.
	 *
	 * Outgoing HTTP requests are first tunneled through the proxy server using the
	 * `CONNECT` HTTP request method to establish a connection to the proxy server,
	 * and then the proxy server connects to the destination target and issues the
	 * HTTP request from the proxy server.
	 *
	 * `https:` requests have their socket connection upgraded to TLS once
	 * the connection to the proxy server has been established.
	 */
	class HttpsProxyAgent extends agent_base_1.Agent {
	    constructor(proxy, opts) {
	        super(opts);
	        this.options = { path: undefined };
	        this.proxy = typeof proxy === 'string' ? new url_1.URL(proxy) : proxy;
	        this.proxyHeaders = opts?.headers ?? {};
	        debug('Creating new HttpsProxyAgent instance: %o', this.proxy.href);
	        // Trim off the brackets from IPv6 addresses
	        const host = (this.proxy.hostname || this.proxy.host).replace(/^\[|\]$/g, '');
	        const port = this.proxy.port
	            ? parseInt(this.proxy.port, 10)
	            : this.proxy.protocol === 'https:'
	                ? 443
	                : 80;
	        this.connectOpts = {
	            // Attempt to negotiate http/1.1 for proxy servers that support http/2
	            ALPNProtocols: ['http/1.1'],
	            ...(opts ? omit(opts, 'headers') : null),
	            host,
	            port,
	        };
	    }
	    /**
	     * Called when the node-core HTTP client library is creating a
	     * new HTTP request.
	     */
	    async connect(req, opts) {
	        const { proxy } = this;
	        if (!opts.host) {
	            throw new TypeError('No "host" provided');
	        }
	        // Create a socket connection to the proxy server.
	        let socket;
	        if (proxy.protocol === 'https:') {
	            debug('Creating `tls.Socket`: %o', this.connectOpts);
	            socket = tls.connect(setServernameFromNonIpHost(this.connectOpts));
	        }
	        else {
	            debug('Creating `net.Socket`: %o', this.connectOpts);
	            socket = net.connect(this.connectOpts);
	        }
	        const headers = typeof this.proxyHeaders === 'function'
	            ? this.proxyHeaders()
	            : { ...this.proxyHeaders };
	        const host = net.isIPv6(opts.host) ? `[${opts.host}]` : opts.host;
	        let payload = `CONNECT ${host}:${opts.port} HTTP/1.1\r\n`;
	        // Inject the `Proxy-Authorization` header if necessary.
	        if (proxy.username || proxy.password) {
	            const auth = `${decodeURIComponent(proxy.username)}:${decodeURIComponent(proxy.password)}`;
	            headers['Proxy-Authorization'] = `Basic ${Buffer.from(auth).toString('base64')}`;
	        }
	        headers.Host = `${host}:${opts.port}`;
	        if (!headers['Proxy-Connection']) {
	            headers['Proxy-Connection'] = this.keepAlive
	                ? 'Keep-Alive'
	                : 'close';
	        }
	        for (const name of Object.keys(headers)) {
	            payload += `${name}: ${headers[name]}\r\n`;
	        }
	        const proxyResponsePromise = (0, parse_proxy_response_1.parseProxyResponse)(socket);
	        socket.write(`${payload}\r\n`);
	        const { connect, buffered } = await proxyResponsePromise;
	        req.emit('proxyConnect', connect);
	        this.emit('proxyConnect', connect, req);
	        if (connect.statusCode === 200) {
	            req.once('socket', resume);
	            if (opts.secureEndpoint) {
	                // The proxy is connecting to a TLS server, so upgrade
	                // this socket connection to a TLS connection.
	                debug('Upgrading socket connection to TLS');
	                return tls.connect({
	                    ...omit(setServernameFromNonIpHost(opts), 'host', 'path', 'port'),
	                    socket,
	                });
	            }
	            return socket;
	        }
	        // Some other status code that's not 200... need to re-play the HTTP
	        // header "data" events onto the socket once the HTTP machinery is
	        // attached so that the node core `http` can parse and handle the
	        // error status code.
	        // Close the original socket, and a new "fake" socket is returned
	        // instead, so that the proxy doesn't get the HTTP request
	        // written to it (which may contain `Authorization` headers or other
	        // sensitive data).
	        //
	        // See: https://hackerone.com/reports/541502
	        socket.destroy();
	        const fakeSocket = new net.Socket({ writable: false });
	        fakeSocket.readable = true;
	        // Need to wait for the "socket" event to re-play the "data" events.
	        req.once('socket', (s) => {
	            debug('Replaying proxy buffer for failed request');
	            (0, assert_1.default)(s.listenerCount('data') > 0);
	            // Replay the "buffered" Buffer onto the fake `socket`, since at
	            // this point the HTTP module machinery has been hooked up for
	            // the user.
	            s.push(buffered);
	            s.push(null);
	        });
	        return fakeSocket;
	    }
	}
	HttpsProxyAgent.protocols = ['http', 'https'];
	dist$2.HttpsProxyAgent = HttpsProxyAgent;
	function resume(socket) {
	    socket.resume();
	}
	function omit(obj, ...keys) {
	    const ret = {};
	    let key;
	    for (key in obj) {
	        if (!keys.includes(key)) {
	            ret[key] = obj[key];
	        }
	    }
	    return ret;
	}
	
	return dist$2;
}

var distExports$1 = requireDist$1();

var dist = {};

var hasRequiredDist;

function requireDist () {
	if (hasRequiredDist) return dist;
	hasRequiredDist = 1;
	var __createBinding = (dist && dist.__createBinding) || (Object.create ? (function(o, m, k, k2) {
	    if (k2 === undefined) k2 = k;
	    var desc = Object.getOwnPropertyDescriptor(m, k);
	    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
	      desc = { enumerable: true, get: function() { return m[k]; } };
	    }
	    Object.defineProperty(o, k2, desc);
	}) : (function(o, m, k, k2) {
	    if (k2 === undefined) k2 = k;
	    o[k2] = m[k];
	}));
	var __setModuleDefault = (dist && dist.__setModuleDefault) || (Object.create ? (function(o, v) {
	    Object.defineProperty(o, "default", { enumerable: true, value: v });
	}) : function(o, v) {
	    o["default"] = v;
	});
	var __importStar = (dist && dist.__importStar) || function (mod) {
	    if (mod && mod.__esModule) return mod;
	    var result = {};
	    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
	    __setModuleDefault(result, mod);
	    return result;
	};
	var __importDefault = (dist && dist.__importDefault) || function (mod) {
	    return (mod && mod.__esModule) ? mod : { "default": mod };
	};
	Object.defineProperty(dist, "__esModule", { value: true });
	dist.HttpProxyAgent = void 0;
	const net = __importStar(require$$0$2);
	const tls = __importStar(require$$1$3);
	const debug_1 = __importDefault(requireSrc());
	const events_1 = require$$3;
	const agent_base_1 = requireDist$2();
	const url_1 = require$$5;
	const debug = (0, debug_1.default)('http-proxy-agent');
	/**
	 * The `HttpProxyAgent` implements an HTTP Agent subclass that connects
	 * to the specified "HTTP proxy server" in order to proxy HTTP requests.
	 */
	class HttpProxyAgent extends agent_base_1.Agent {
	    constructor(proxy, opts) {
	        super(opts);
	        this.proxy = typeof proxy === 'string' ? new url_1.URL(proxy) : proxy;
	        this.proxyHeaders = opts?.headers ?? {};
	        debug('Creating new HttpProxyAgent instance: %o', this.proxy.href);
	        // Trim off the brackets from IPv6 addresses
	        const host = (this.proxy.hostname || this.proxy.host).replace(/^\[|\]$/g, '');
	        const port = this.proxy.port
	            ? parseInt(this.proxy.port, 10)
	            : this.proxy.protocol === 'https:'
	                ? 443
	                : 80;
	        this.connectOpts = {
	            ...(opts ? omit(opts, 'headers') : null),
	            host,
	            port,
	        };
	    }
	    addRequest(req, opts) {
	        req._header = null;
	        this.setRequestProps(req, opts);
	        // @ts-expect-error `addRequest()` isn't defined in `@types/node`
	        super.addRequest(req, opts);
	    }
	    setRequestProps(req, opts) {
	        const { proxy } = this;
	        const protocol = opts.secureEndpoint ? 'https:' : 'http:';
	        const hostname = req.getHeader('host') || 'localhost';
	        const base = `${protocol}//${hostname}`;
	        const url = new url_1.URL(req.path, base);
	        if (opts.port !== 80) {
	            url.port = String(opts.port);
	        }
	        // Change the `http.ClientRequest` instance's "path" field
	        // to the absolute path of the URL that will be requested.
	        req.path = String(url);
	        // Inject the `Proxy-Authorization` header if necessary.
	        const headers = typeof this.proxyHeaders === 'function'
	            ? this.proxyHeaders()
	            : { ...this.proxyHeaders };
	        if (proxy.username || proxy.password) {
	            const auth = `${decodeURIComponent(proxy.username)}:${decodeURIComponent(proxy.password)}`;
	            headers['Proxy-Authorization'] = `Basic ${Buffer.from(auth).toString('base64')}`;
	        }
	        if (!headers['Proxy-Connection']) {
	            headers['Proxy-Connection'] = this.keepAlive
	                ? 'Keep-Alive'
	                : 'close';
	        }
	        for (const name of Object.keys(headers)) {
	            const value = headers[name];
	            if (value) {
	                req.setHeader(name, value);
	            }
	        }
	    }
	    async connect(req, opts) {
	        req._header = null;
	        if (!req.path.includes('://')) {
	            this.setRequestProps(req, opts);
	        }
	        // At this point, the http ClientRequest's internal `_header` field
	        // might have already been set. If this is the case then we'll need
	        // to re-generate the string since we just changed the `req.path`.
	        let first;
	        let endOfHeaders;
	        debug('Regenerating stored HTTP header string for request');
	        req._implicitHeader();
	        if (req.outputData && req.outputData.length > 0) {
	            debug('Patching connection write() output buffer with updated header');
	            first = req.outputData[0].data;
	            endOfHeaders = first.indexOf('\r\n\r\n') + 4;
	            req.outputData[0].data =
	                req._header + first.substring(endOfHeaders);
	            debug('Output buffer: %o', req.outputData[0].data);
	        }
	        // Create a socket connection to the proxy server.
	        let socket;
	        if (this.proxy.protocol === 'https:') {
	            debug('Creating `tls.Socket`: %o', this.connectOpts);
	            socket = tls.connect(this.connectOpts);
	        }
	        else {
	            debug('Creating `net.Socket`: %o', this.connectOpts);
	            socket = net.connect(this.connectOpts);
	        }
	        // Wait for the socket's `connect` event, so that this `callback()`
	        // function throws instead of the `http` request machinery. This is
	        // important for i.e. `PacProxyAgent` which determines a failed proxy
	        // connection via the `callback()` function throwing.
	        await (0, events_1.once)(socket, 'connect');
	        return socket;
	    }
	}
	HttpProxyAgent.protocols = ['http', 'https'];
	dist.HttpProxyAgent = HttpProxyAgent;
	function omit(obj, ...keys) {
	    const ret = {};
	    let key;
	    for (key in obj) {
	        if (!keys.includes(key)) {
	            ret[key] = obj[key];
	        }
	    }
	    return ret;
	}
	
	return dist;
}

var distExports = requireDist();

// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.
const HTTPS_PROXY = "HTTPS_PROXY";
const HTTP_PROXY = "HTTP_PROXY";
const ALL_PROXY = "ALL_PROXY";
const NO_PROXY = "NO_PROXY";
/**
 * The programmatic identifier of the proxyPolicy.
 */
const proxyPolicyName = "proxyPolicy";
/**
 * Stores the patterns specified in NO_PROXY environment variable.
 * @internal
 */
const globalNoProxyList = [];
let noProxyListLoaded = false;
/** A cache of whether a host should bypass the proxy. */
const globalBypassedMap = new Map();
function getEnvironmentValue(name) {
    if (process.env[name]) {
        return process.env[name];
    }
    else if (process.env[name.toLowerCase()]) {
        return process.env[name.toLowerCase()];
    }
    return undefined;
}
function loadEnvironmentProxyValue() {
    if (!process) {
        return undefined;
    }
    const httpsProxy = getEnvironmentValue(HTTPS_PROXY);
    const allProxy = getEnvironmentValue(ALL_PROXY);
    const httpProxy = getEnvironmentValue(HTTP_PROXY);
    return httpsProxy || allProxy || httpProxy;
}
/**
 * Check whether the host of a given `uri` matches any pattern in the no proxy list.
 * If there's a match, any request sent to the same host shouldn't have the proxy settings set.
 * This implementation is a port of https://github.com/Azure/azure-sdk-for-net/blob/8cca811371159e527159c7eb65602477898683e2/sdk/core/Azure.Core/src/Pipeline/Internal/HttpEnvironmentProxy.cs#L210
 */
function isBypassed(uri, noProxyList, bypassedMap) {
    if (noProxyList.length === 0) {
        return false;
    }
    const host = new URL(uri).hostname;
    if (bypassedMap === null || bypassedMap === void 0 ? void 0 : bypassedMap.has(host)) {
        return bypassedMap.get(host);
    }
    let isBypassedFlag = false;
    for (const pattern of noProxyList) {
        if (pattern[0] === ".") {
            // This should match either domain it self or any subdomain or host
            // .foo.com will match foo.com it self or *.foo.com
            if (host.endsWith(pattern)) {
                isBypassedFlag = true;
            }
            else {
                if (host.length === pattern.length - 1 && host === pattern.slice(1)) {
                    isBypassedFlag = true;
                }
            }
        }
        else {
            if (host === pattern) {
                isBypassedFlag = true;
            }
        }
    }
    bypassedMap === null || bypassedMap === void 0 ? void 0 : bypassedMap.set(host, isBypassedFlag);
    return isBypassedFlag;
}
function loadNoProxy() {
    const noProxy = getEnvironmentValue(NO_PROXY);
    noProxyListLoaded = true;
    if (noProxy) {
        return noProxy
            .split(",")
            .map((item) => item.trim())
            .filter((item) => item.length);
    }
    return [];
}
/**
 * This method attempts to parse a proxy URL from the environment
 * variables `HTTPS_PROXY` or `HTTP_PROXY`.
 */
function getDefaultProxySettingsInternal() {
    const envProxy = loadEnvironmentProxyValue();
    return envProxy ? new URL(envProxy) : undefined;
}
function getUrlFromProxySettings(settings) {
    let parsedProxyUrl;
    try {
        parsedProxyUrl = new URL(settings.host);
    }
    catch (_a) {
        throw new Error(`Expecting a valid host string in proxy settings, but found "${settings.host}".`);
    }
    parsedProxyUrl.port = String(settings.port);
    if (settings.username) {
        parsedProxyUrl.username = settings.username;
    }
    if (settings.password) {
        parsedProxyUrl.password = settings.password;
    }
    return parsedProxyUrl;
}
function setProxyAgentOnRequest(request, cachedAgents, proxyUrl) {
    // Custom Agent should take precedence so if one is present
    // we should skip to avoid overwriting it.
    if (request.agent) {
        return;
    }
    const url = new URL(request.url);
    const isInsecure = url.protocol !== "https:";
    if (request.tlsSettings) {
        logger$2.warning("TLS settings are not supported in combination with custom Proxy, certificates provided to the client will be ignored.");
    }
    const headers = request.headers.toJSON();
    if (isInsecure) {
        if (!cachedAgents.httpProxyAgent) {
            cachedAgents.httpProxyAgent = new distExports.HttpProxyAgent(proxyUrl, { headers });
        }
        request.agent = cachedAgents.httpProxyAgent;
    }
    else {
        if (!cachedAgents.httpsProxyAgent) {
            cachedAgents.httpsProxyAgent = new distExports$1.HttpsProxyAgent(proxyUrl, { headers });
        }
        request.agent = cachedAgents.httpsProxyAgent;
    }
}
/**
 * A policy that allows one to apply proxy settings to all requests.
 * If not passed static settings, they will be retrieved from the HTTPS_PROXY
 * or HTTP_PROXY environment variables.
 * @param proxySettings - ProxySettings to use on each request.
 * @param options - additional settings, for example, custom NO_PROXY patterns
 */
function proxyPolicy$1(proxySettings, options) {
    if (!noProxyListLoaded) {
        globalNoProxyList.push(...loadNoProxy());
    }
    const defaultProxy = proxySettings
        ? getUrlFromProxySettings(proxySettings)
        : getDefaultProxySettingsInternal();
    const cachedAgents = {};
    return {
        name: proxyPolicyName,
        async sendRequest(request, next) {
            var _a;
            if (!request.proxySettings &&
                defaultProxy &&
                !isBypassed(request.url, (_a = void 0 ) !== null && _a !== void 0 ? _a : globalNoProxyList, globalBypassedMap)) {
                setProxyAgentOnRequest(request, cachedAgents, defaultProxy);
            }
            else if (request.proxySettings) {
                setProxyAgentOnRequest(request, cachedAgents, getUrlFromProxySettings(request.proxySettings));
            }
            return next(request);
        },
    };
}

// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.
/**
 * Name of the Agent Policy
 */
const agentPolicyName = "agentPolicy";
/**
 * Gets a pipeline policy that sets http.agent
 */
function agentPolicy$1(agent) {
    return {
        name: agentPolicyName,
        sendRequest: async (req, next) => {
            // Users may define an agent on the request, honor it over the client level one
            if (!req.agent) {
                req.agent = agent;
            }
            return next(req);
        },
    };
}

// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.
/**
 * Name of the TLS Policy
 */
const tlsPolicyName = "tlsPolicy";
/**
 * Gets a pipeline policy that adds the client certificate to the HttpClient agent for authentication.
 */
function tlsPolicy$1(tlsSettings) {
    return {
        name: tlsPolicyName,
        sendRequest: async (req, next) => {
            // Users may define a request tlsSettings, honor those over the client level one
            if (!req.tlsSettings) {
                req.tlsSettings = tlsSettings;
            }
            return next(req);
        },
    };
}

// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.
function isNodeReadableStream(x) {
    return Boolean(x && typeof x["pipe"] === "function");
}
function isWebReadableStream(x) {
    return Boolean(x &&
        typeof x.getReader === "function" &&
        typeof x.tee === "function");
}
function isBinaryBody(body) {
    return (body !== undefined &&
        (body instanceof Uint8Array ||
            isReadableStream(body) ||
            typeof body === "function" ||
            body instanceof Blob));
}
function isReadableStream(x) {
    return isNodeReadableStream(x) || isWebReadableStream(x);
}
function isBlob(x) {
    return typeof x.stream === "function";
}

// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.
function streamAsyncIterator() {
    return __asyncGenerator(this, arguments, function* streamAsyncIterator_1() {
        const reader = this.getReader();
        try {
            while (true) {
                const { done, value } = yield __await(reader.read());
                if (done) {
                    return yield __await(void 0);
                }
                yield yield __await(value);
            }
        }
        finally {
            reader.releaseLock();
        }
    });
}
function makeAsyncIterable(webStream) {
    if (!webStream[Symbol.asyncIterator]) {
        webStream[Symbol.asyncIterator] = streamAsyncIterator.bind(webStream);
    }
    if (!webStream.values) {
        webStream.values = streamAsyncIterator.bind(webStream);
    }
}
function ensureNodeStream(stream) {
    if (stream instanceof ReadableStream) {
        makeAsyncIterable(stream);
        return Readable.fromWeb(stream);
    }
    else {
        return stream;
    }
}
function toStream(source) {
    if (source instanceof Uint8Array) {
        return Readable.from(Buffer.from(source));
    }
    else if (isBlob(source)) {
        return ensureNodeStream(source.stream());
    }
    else {
        return ensureNodeStream(source);
    }
}
/**
 * Utility function that concatenates a set of binary inputs into one combined output.
 *
 * @param sources - array of sources for the concatenation
 * @returns - in Node, a (() =\> NodeJS.ReadableStream) which, when read, produces a concatenation of all the inputs.
 *           In browser, returns a `Blob` representing all the concatenated inputs.
 *
 * @internal
 */
async function concat(sources) {
    return function () {
        const streams = sources.map((x) => (typeof x === "function" ? x() : x)).map(toStream);
        return Readable.from((function () {
            return __asyncGenerator(this, arguments, function* () {
                var _a, e_1, _b, _c;
                for (const stream of streams) {
                    try {
                        for (var _d = true, stream_1 = (e_1 = void 0, __asyncValues(stream)), stream_1_1; stream_1_1 = yield __await(stream_1.next()), _a = stream_1_1.done, !_a; _d = true) {
                            _c = stream_1_1.value;
                            _d = false;
                            const chunk = _c;
                            yield yield __await(chunk);
                        }
                    }
                    catch (e_1_1) { e_1 = { error: e_1_1 }; }
                    finally {
                        try {
                            if (!_d && !_a && (_b = stream_1.return)) yield __await(_b.call(stream_1));
                        }
                        finally { if (e_1) throw e_1.error; }
                    }
                }
            });
        })());
    };
}

// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.
function generateBoundary() {
    return `----AzSDKFormBoundary${randomUUID()}`;
}
function encodeHeaders(headers) {
    let result = "";
    for (const [key, value] of headers) {
        result += `${key}: ${value}\r\n`;
    }
    return result;
}
function getLength(source) {
    if (source instanceof Uint8Array) {
        return source.byteLength;
    }
    else if (isBlob(source)) {
        // if was created using createFile then -1 means we have an unknown size
        return source.size === -1 ? undefined : source.size;
    }
    else {
        return undefined;
    }
}
function getTotalLength(sources) {
    let total = 0;
    for (const source of sources) {
        const partLength = getLength(source);
        if (partLength === undefined) {
            return undefined;
        }
        else {
            total += partLength;
        }
    }
    return total;
}
async function buildRequestBody(request, parts, boundary) {
    const sources = [
        stringToUint8Array(`--${boundary}`, "utf-8"),
        ...parts.flatMap((part) => [
            stringToUint8Array("\r\n", "utf-8"),
            stringToUint8Array(encodeHeaders(part.headers), "utf-8"),
            stringToUint8Array("\r\n", "utf-8"),
            part.body,
            stringToUint8Array(`\r\n--${boundary}`, "utf-8"),
        ]),
        stringToUint8Array("--\r\n\r\n", "utf-8"),
    ];
    const contentLength = getTotalLength(sources);
    if (contentLength) {
        request.headers.set("Content-Length", contentLength);
    }
    request.body = await concat(sources);
}
/**
 * Name of multipart policy
 */
const multipartPolicyName$1 = "multipartPolicy";
const maxBoundaryLength = 70;
const validBoundaryCharacters = new Set(`abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'()+,-./:=?`);
function assertValidBoundary(boundary) {
    if (boundary.length > maxBoundaryLength) {
        throw new Error(`Multipart boundary "${boundary}" exceeds maximum length of 70 characters`);
    }
    if (Array.from(boundary).some((x) => !validBoundaryCharacters.has(x))) {
        throw new Error(`Multipart boundary "${boundary}" contains invalid characters`);
    }
}
/**
 * Pipeline policy for multipart requests
 */
function multipartPolicy$1() {
    return {
        name: multipartPolicyName$1,
        async sendRequest(request, next) {
            var _a;
            if (!request.multipartBody) {
                return next(request);
            }
            if (request.body) {
                throw new Error("multipartBody and regular body cannot be set at the same time");
            }
            let boundary = request.multipartBody.boundary;
            const contentTypeHeader = (_a = request.headers.get("Content-Type")) !== null && _a !== void 0 ? _a : "multipart/mixed";
            const parsedHeader = contentTypeHeader.match(/^(multipart\/[^ ;]+)(?:; *boundary=(.+))?$/);
            if (!parsedHeader) {
                throw new Error(`Got multipart request body, but content-type header was not multipart: ${contentTypeHeader}`);
            }
            const [, contentType, parsedBoundary] = parsedHeader;
            if (parsedBoundary && boundary && parsedBoundary !== boundary) {
                throw new Error(`Multipart boundary was specified as ${parsedBoundary} in the header, but got ${boundary} in the request body`);
            }
            boundary !== null && boundary !== void 0 ? boundary : (boundary = parsedBoundary);
            if (boundary) {
                assertValidBoundary(boundary);
            }
            else {
                boundary = generateBoundary();
            }
            request.headers.set("Content-Type", `${contentType}; boundary=${boundary}`);
            await buildRequestBody(request, request.multipartBody.parts, boundary);
            request.multipartBody = undefined;
            return next(request);
        },
    };
}

// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.
/**
 * Create a new pipeline with a default set of customizable policies.
 * @param options - Options to configure a custom pipeline.
 */
function createPipelineFromOptions$1(options) {
    const pipeline = createEmptyPipeline$1();
    if (isNodeLike$1) {
        if (options.agent) {
            pipeline.addPolicy(agentPolicy$1(options.agent));
        }
        if (options.tlsOptions) {
            pipeline.addPolicy(tlsPolicy$1(options.tlsOptions));
        }
        pipeline.addPolicy(proxyPolicy$1(options.proxyOptions));
        pipeline.addPolicy(decompressResponsePolicy$1());
    }
    pipeline.addPolicy(formDataPolicy$1(), { beforePolicies: [multipartPolicyName$1] });
    pipeline.addPolicy(userAgentPolicy$1(options.userAgentOptions));
    // The multipart policy is added after policies with no phase, so that
    // policies can be added between it and formDataPolicy to modify
    // properties (e.g., making the boundary constant in recorded tests).
    pipeline.addPolicy(multipartPolicy$1(), { afterPhase: "Deserialize" });
    pipeline.addPolicy(defaultRetryPolicy$1(options.retryOptions), { phase: "Retry" });
    if (isNodeLike$1) {
        // Both XHR and Fetch expect to handle redirects automatically,
        // so only include this policy when we're in Node.
        pipeline.addPolicy(redirectPolicy$1(options.redirectOptions), { afterPhase: "Retry" });
    }
    pipeline.addPolicy(logPolicy$1(options.loggingOptions), { afterPhase: "Sign" });
    return pipeline;
}

// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.
const apiVersionPolicyName$1 = "ApiVersionPolicy";
/**
 * Creates a policy that sets the apiVersion as a query parameter on every request
 * @param options - Client options
 * @returns Pipeline policy that sets the apiVersion as a query parameter on every request
 */
function apiVersionPolicy$1(options) {
    return {
        name: apiVersionPolicyName$1,
        sendRequest: (req, next) => {
            // Use the apiVesion defined in request url directly
            // Append one if there is no apiVesion and we have one at client options
            const url = new URL(req.url);
            if (!url.searchParams.get("api-version") && options.apiVersion) {
                req.url = `${req.url}${Array.from(url.searchParams.keys()).length > 0 ? "&" : "?"}api-version=${options.apiVersion}`;
            }
            return next(req);
        },
    };
}

// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.
/**
 * Type guard to check if a credential is an OAuth2 token credential.
 */
function isOAuth2TokenCredential(credential) {
    return "getOAuth2Token" in credential;
}
/**
 * Type guard to check if a credential is a Bearer token credential.
 */
function isBearerTokenCredential(credential) {
    return "getBearerToken" in credential;
}
/**
 * Type guard to check if a credential is a Basic auth credential.
 */
function isBasicCredential(credential) {
    return "username" in credential && "password" in credential;
}
/**
 * Type guard to check if a credential is an API key credential.
 */
function isApiKeyCredential(credential) {
    return "key" in credential;
}

// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.
// Ensure the warining is only emitted once
let insecureConnectionWarningEmmitted = false;
/**
 * Checks if the request is allowed to be sent over an insecure connection.
 *
 * A request is allowed to be sent over an insecure connection when:
 * - The `allowInsecureConnection` option is set to `true`.
 * - The request has the `allowInsecureConnection` property set to `true`.
 * - The request is being sent to `localhost` or `127.0.0.1`
 */
function allowInsecureConnection(request, options) {
    if (options.allowInsecureConnection && request.allowInsecureConnection) {
        const url = new URL(request.url);
        if (url.hostname === "localhost" || url.hostname === "127.0.0.1") {
            return true;
        }
    }
    return false;
}
/**
 * Logs a warning about sending a token over an insecure connection.
 *
 * This function will emit a node warning once, but log the warning every time.
 */
function emitInsecureConnectionWarning() {
    const warning = "Sending token over insecure transport. Assume any token issued is compromised.";
    logger$2.warning(warning);
    if (typeof (process === null || process === void 0 ? void 0 : process.emitWarning) === "function" && !insecureConnectionWarningEmmitted) {
        insecureConnectionWarningEmmitted = true;
        process.emitWarning(warning);
    }
}
/**
 * Ensures that authentication is only allowed over HTTPS unless explicitly allowed.
 * Throws an error if the connection is not secure and not explicitly allowed.
 */
function ensureSecureConnection(request, options) {
    if (!request.url.toLowerCase().startsWith("https://")) {
        if (allowInsecureConnection(request, options)) {
            emitInsecureConnectionWarning();
        }
        else {
            throw new Error("Authentication is not permitted for non-TLS protected (non-https) URLs when allowInsecureConnection is false.");
        }
    }
}

// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.
/**
 * Name of the API Key Authentication Policy
 */
const apiKeyAuthenticationPolicyName = "apiKeyAuthenticationPolicy";
/**
 * Gets a pipeline policy that adds API key authentication to requests
 */
function apiKeyAuthenticationPolicy(options) {
    return {
        name: apiKeyAuthenticationPolicyName,
        async sendRequest(request, next) {
            var _a, _b;
            // Ensure allowInsecureConnection is explicitly set when sending request to non-https URLs
            ensureSecureConnection(request, options);
            const scheme = (_b = ((_a = request.authSchemes) !== null && _a !== void 0 ? _a : options.authSchemes)) === null || _b === void 0 ? void 0 : _b.find((x) => x.kind === "apiKey");
            // Skip adding authentication header if no API key authentication scheme is found
            if (!scheme) {
                return next(request);
            }
            if (scheme.apiKeyLocation !== "header") {
                throw new Error(`Unsupported API key location: ${scheme.apiKeyLocation}`);
            }
            request.headers.set(scheme.name, options.credential.key);
            return next(request);
        },
    };
}

// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.
/**
 * Name of the Basic Authentication Policy
 */
const basicAuthenticationPolicyName = "bearerAuthenticationPolicy";
/**
 * Gets a pipeline policy that adds basic authentication to requests
 */
function basicAuthenticationPolicy(options) {
    return {
        name: basicAuthenticationPolicyName,
        async sendRequest(request, next) {
            var _a, _b;
            // Ensure allowInsecureConnection is explicitly set when sending request to non-https URLs
            ensureSecureConnection(request, options);
            const scheme = (_b = ((_a = request.authSchemes) !== null && _a !== void 0 ? _a : options.authSchemes)) === null || _b === void 0 ? void 0 : _b.find((x) => x.kind === "http" && x.scheme === "basic");
            // Skip adding authentication header if no basic authentication scheme is found
            if (!scheme) {
                return next(request);
            }
            const { username, password } = options.credential;
            const headerValue = uint8ArrayToString(stringToUint8Array(`${username}:${password}`, "utf-8"), "base64");
            request.headers.set("Authorization", `Basic ${headerValue}`);
            return next(request);
        },
    };
}

// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.
/**
 * Name of the Bearer Authentication Policy
 */
const bearerAuthenticationPolicyName = "bearerAuthenticationPolicy";
/**
 * Gets a pipeline policy that adds bearer token authentication to requests
 */
function bearerAuthenticationPolicy(options) {
    return {
        name: bearerAuthenticationPolicyName,
        async sendRequest(request, next) {
            var _a, _b;
            // Ensure allowInsecureConnection is explicitly set when sending request to non-https URLs
            ensureSecureConnection(request, options);
            const scheme = (_b = ((_a = request.authSchemes) !== null && _a !== void 0 ? _a : options.authSchemes)) === null || _b === void 0 ? void 0 : _b.find((x) => x.kind === "http" && x.scheme === "bearer");
            // Skip adding authentication header if no bearer authentication scheme is found
            if (!scheme) {
                return next(request);
            }
            const token = await options.credential.getBearerToken({
                abortSignal: request.abortSignal,
            });
            request.headers.set("Authorization", `Bearer ${token}`);
            return next(request);
        },
    };
}

// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.
/**
 * Name of the OAuth2 Authentication Policy
 */
const oauth2AuthenticationPolicyName = "oauth2AuthenticationPolicy";
/**
 * Gets a pipeline policy that adds authorization header from OAuth2 schemes
 */
function oauth2AuthenticationPolicy(options) {
    return {
        name: oauth2AuthenticationPolicyName,
        async sendRequest(request, next) {
            var _a, _b;
            // Ensure allowInsecureConnection is explicitly set when sending request to non-https URLs
            ensureSecureConnection(request, options);
            const scheme = (_b = ((_a = request.authSchemes) !== null && _a !== void 0 ? _a : options.authSchemes)) === null || _b === void 0 ? void 0 : _b.find((x) => x.kind === "oauth2");
            // Skip adding authentication header if no OAuth2 authentication scheme is found
            if (!scheme) {
                return next(request);
            }
            const token = await options.credential.getOAuth2Token(scheme.flows, {
                abortSignal: request.abortSignal,
            });
            request.headers.set("Authorization", `Bearer ${token}`);
            return next(request);
        },
    };
}

// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.
let cachedHttpClient;
/**
 * Creates a default rest pipeline to re-use accross Rest Level Clients
 */
function createDefaultPipeline$1(options = {}) {
    const pipeline = createPipelineFromOptions$1(options);
    pipeline.addPolicy(apiVersionPolicy$1(options));
    const { credential, authSchemes, allowInsecureConnection } = options;
    if (credential) {
        if (isApiKeyCredential(credential)) {
            pipeline.addPolicy(apiKeyAuthenticationPolicy({ authSchemes, credential, allowInsecureConnection }));
        }
        else if (isBasicCredential(credential)) {
            pipeline.addPolicy(basicAuthenticationPolicy({ authSchemes, credential, allowInsecureConnection }));
        }
        else if (isBearerTokenCredential(credential)) {
            pipeline.addPolicy(bearerAuthenticationPolicy({ authSchemes, credential, allowInsecureConnection }));
        }
        else if (isOAuth2TokenCredential(credential)) {
            pipeline.addPolicy(oauth2AuthenticationPolicy({ authSchemes, credential, allowInsecureConnection }));
        }
    }
    return pipeline;
}
function getCachedDefaultHttpsClient() {
    if (!cachedHttpClient) {
        cachedHttpClient = createDefaultHttpClient();
    }
    return cachedHttpClient;
}

// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.
/**
 * Get value of a header in the part descriptor ignoring case
 */
function getHeaderValue(descriptor, headerName) {
    if (descriptor.headers) {
        const actualHeaderName = Object.keys(descriptor.headers).find((x) => x.toLowerCase() === headerName.toLowerCase());
        if (actualHeaderName) {
            return descriptor.headers[actualHeaderName];
        }
    }
    return undefined;
}
function getPartContentType(descriptor) {
    const contentTypeHeader = getHeaderValue(descriptor, "content-type");
    if (contentTypeHeader) {
        return contentTypeHeader;
    }
    // Special value of null means content type is to be omitted
    if (descriptor.contentType === null) {
        return undefined;
    }
    if (descriptor.contentType) {
        return descriptor.contentType;
    }
    const { body } = descriptor;
    if (body === null || body === undefined) {
        return undefined;
    }
    if (typeof body === "string" || typeof body === "number" || typeof body === "boolean") {
        return "text/plain; charset=UTF-8";
    }
    if (body instanceof Blob) {
        return body.type || "application/octet-stream";
    }
    if (isBinaryBody(body)) {
        return "application/octet-stream";
    }
    // arbitrary non-text object -> generic JSON content type by default. We will try to JSON.stringify the body.
    return "application/json";
}
/**
 * Enclose value in quotes and escape special characters, for use in the Content-Disposition header
 */
function escapeDispositionField(value) {
    return JSON.stringify(value);
}
function getContentDisposition(descriptor) {
    var _a;
    const contentDispositionHeader = getHeaderValue(descriptor, "content-disposition");
    if (contentDispositionHeader) {
        return contentDispositionHeader;
    }
    if (descriptor.dispositionType === undefined &&
        descriptor.name === undefined &&
        descriptor.filename === undefined) {
        return undefined;
    }
    const dispositionType = (_a = descriptor.dispositionType) !== null && _a !== void 0 ? _a : "form-data";
    let disposition = dispositionType;
    if (descriptor.name) {
        disposition += `; name=${escapeDispositionField(descriptor.name)}`;
    }
    let filename = undefined;
    if (descriptor.filename) {
        filename = descriptor.filename;
    }
    else if (typeof File !== "undefined" && descriptor.body instanceof File) {
        const filenameFromFile = descriptor.body.name;
        if (filenameFromFile !== "") {
            filename = filenameFromFile;
        }
    }
    if (filename) {
        disposition += `; filename=${escapeDispositionField(filename)}`;
    }
    return disposition;
}
function normalizeBody(body, contentType) {
    if (body === undefined) {
        // zero-length body
        return new Uint8Array([]);
    }
    // binary and primitives should go straight on the wire regardless of content type
    if (isBinaryBody(body)) {
        return body;
    }
    if (typeof body === "string" || typeof body === "number" || typeof body === "boolean") {
        return stringToUint8Array(String(body), "utf-8");
    }
    // stringify objects for JSON-ish content types e.g. application/json, application/merge-patch+json, application/vnd.oci.manifest.v1+json, application.json; charset=UTF-8
    if (contentType && /application\/(.+\+)?json(;.+)?/i.test(String(contentType))) {
        return stringToUint8Array(JSON.stringify(body), "utf-8");
    }
    throw new RestError$1(`Unsupported body/content-type combination: ${body}, ${contentType}`);
}
function buildBodyPart(descriptor) {
    var _a;
    const contentType = getPartContentType(descriptor);
    const contentDisposition = getContentDisposition(descriptor);
    const headers = createHttpHeaders((_a = descriptor.headers) !== null && _a !== void 0 ? _a : {});
    if (contentType) {
        headers.set("content-type", contentType);
    }
    if (contentDisposition) {
        headers.set("content-disposition", contentDisposition);
    }
    const body = normalizeBody(descriptor.body, contentType);
    return {
        headers,
        body,
    };
}
function buildMultipartBody(parts) {
    return { parts: parts.map(buildBodyPart) };
}

// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.
/**
 * Helper function to send request used by the client
 * @param method - method to use to send the request
 * @param url - url to send the request to
 * @param pipeline - pipeline with the policies to run when sending the request
 * @param options - request options
 * @param customHttpClient - a custom HttpClient to use when making the request
 * @returns returns and HttpResponse
 */
async function sendRequest(method, url, pipeline, options = {}, customHttpClient) {
    var _a;
    const httpClient = customHttpClient !== null && customHttpClient !== void 0 ? customHttpClient : getCachedDefaultHttpsClient();
    const request = buildPipelineRequest(method, url, options);
    try {
        const response = await pipeline.sendRequest(httpClient, request);
        const headers = response.headers.toJSON();
        const stream = (_a = response.readableStreamBody) !== null && _a !== void 0 ? _a : response.browserStreamBody;
        const parsedBody = options.responseAsStream || stream !== undefined ? undefined : getResponseBody(response);
        const body = stream !== null && stream !== void 0 ? stream : parsedBody;
        if (options === null || options === void 0 ? void 0 : options.onResponse) {
            options.onResponse(Object.assign(Object.assign({}, response), { request, rawHeaders: headers, parsedBody }));
        }
        return {
            request,
            headers,
            status: `${response.status}`,
            body,
        };
    }
    catch (e) {
        if (isRestError$1(e) && e.response && options.onResponse) {
            const { response } = e;
            const rawHeaders = response.headers.toJSON();
            // UNBRANDED DIFFERENCE: onResponse callback does not have a second __legacyError property
            options === null || options === void 0 ? void 0 : options.onResponse(Object.assign(Object.assign({}, response), { request, rawHeaders }), e);
        }
        throw e;
    }
}
/**
 * Function to determine the request content type
 * @param options - request options InternalRequestParameters
 * @returns returns the content-type
 */
function getRequestContentType(options = {}) {
    var _a, _b, _c;
    return ((_c = (_a = options.contentType) !== null && _a !== void 0 ? _a : (_b = options.headers) === null || _b === void 0 ? void 0 : _b["content-type"]) !== null && _c !== void 0 ? _c : getContentType(options.body));
}
/**
 * Function to determine the content-type of a body
 * this is used if an explicit content-type is not provided
 * @param body - body in the request
 * @returns returns the content-type
 */
function getContentType(body) {
    if (ArrayBuffer.isView(body)) {
        return "application/octet-stream";
    }
    if (typeof body === "string") {
        try {
            JSON.parse(body);
            return "application/json";
        }
        catch (error) {
            // If we fail to parse the body, it is not json
            return undefined;
        }
    }
    // By default return json
    return "application/json";
}
function buildPipelineRequest(method, url, options = {}) {
    var _a, _b, _c;
    const requestContentType = getRequestContentType(options);
    const { body, multipartBody } = getRequestBody$1(options.body, requestContentType);
    const hasContent = body !== undefined || multipartBody !== undefined;
    const headers = createHttpHeaders(Object.assign(Object.assign(Object.assign({}, (options.headers ? options.headers : {})), { accept: (_c = (_a = options.accept) !== null && _a !== void 0 ? _a : (_b = options.headers) === null || _b === void 0 ? void 0 : _b.accept) !== null && _c !== void 0 ? _c : "application/json" }), (hasContent &&
        requestContentType && {
        "content-type": requestContentType,
    })));
    return createPipelineRequest({
        url,
        method,
        body,
        multipartBody,
        headers,
        allowInsecureConnection: options.allowInsecureConnection,
        abortSignal: options.abortSignal,
        onUploadProgress: options.onUploadProgress,
        onDownloadProgress: options.onDownloadProgress,
        timeout: options.timeout,
        enableBrowserStreams: true,
        streamResponseStatusCodes: options.responseAsStream
            ? new Set([Number.POSITIVE_INFINITY])
            : undefined,
    });
}
/**
 * Prepares the body before sending the request
 */
function getRequestBody$1(body, contentType = "") {
    if (body === undefined) {
        return { body: undefined };
    }
    if (typeof FormData !== "undefined" && body instanceof FormData) {
        return { body };
    }
    if (isReadableStream(body)) {
        return { body };
    }
    if (ArrayBuffer.isView(body)) {
        return { body: body instanceof Uint8Array ? body : JSON.stringify(body) };
    }
    const firstType = contentType.split(";")[0];
    switch (firstType) {
        case "application/json":
            return { body: JSON.stringify(body) };
        case "multipart/form-data":
            if (Array.isArray(body)) {
                return { multipartBody: buildMultipartBody(body) };
            }
            return { body: JSON.stringify(body) };
        case "text/plain":
            return { body: String(body) };
        default:
            if (typeof body === "string") {
                return { body };
            }
            return { body: JSON.stringify(body) };
    }
}
/**
 * Prepares the response body
 */
function getResponseBody(response) {
    var _a, _b;
    // Set the default response type
    const contentType = (_a = response.headers.get("content-type")) !== null && _a !== void 0 ? _a : "";
    const firstType = contentType.split(";")[0];
    const bodyToParse = (_b = response.bodyAsText) !== null && _b !== void 0 ? _b : "";
    if (firstType === "text/plain") {
        return String(bodyToParse);
    }
    // Default to "application/json" and fallback to string;
    try {
        return bodyToParse ? JSON.parse(bodyToParse) : undefined;
    }
    catch (error) {
        // If we were supposed to get a JSON object and failed to
        // parse, throw a parse error
        if (firstType === "application/json") {
            throw createParseError(response, error);
        }
        // We are not sure how to handle the response so we return it as
        // plain text.
        return String(bodyToParse);
    }
}
function createParseError(response, err) {
    var _a;
    const msg = `Error "${err}" occurred while parsing the response body - ${response.bodyAsText}.`;
    const errCode = (_a = err.code) !== null && _a !== void 0 ? _a : RestError$1.PARSE_ERROR;
    return new RestError$1(msg, {
        code: errCode,
        statusCode: response.status,
        request: response.request,
        response: response,
    });
}

// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.
function isQueryParameterWithOptions(x) {
    const value = x.value;
    return (value !== undefined && value.toString !== undefined && typeof value.toString === "function");
}
/**
 * Builds the request url, filling in query and path parameters
 * @param endpoint - base url which can be a template url
 * @param routePath - path to append to the endpoint
 * @param pathParameters - values of the path parameters
 * @param options - request parameters including query parameters
 * @returns a full url with path and query parameters
 */
function buildRequestUrl(endpoint, routePath, pathParameters, options = {}) {
    if (routePath.startsWith("https://") || routePath.startsWith("http://")) {
        return routePath;
    }
    endpoint = buildBaseUrl(endpoint, options);
    routePath = buildRoutePath(routePath, pathParameters, options);
    const requestUrl = appendQueryParams(`${endpoint}/${routePath}`, options);
    const url = new URL(requestUrl);
    return (url
        .toString()
        // Remove double forward slashes
        .replace(/([^:]\/)\/+/g, "$1"));
}
function getQueryParamValue(key, allowReserved, style, param) {
    let separator;
    if (style === "pipeDelimited") {
        separator = "|";
    }
    else if (style === "spaceDelimited") {
        separator = "%20";
    }
    else {
        separator = ",";
    }
    let paramValues;
    if (Array.isArray(param)) {
        paramValues = param;
    }
    else if (typeof param === "object" && param.toString === Object.prototype.toString) {
        // If the parameter is an object without a custom toString implementation (e.g. a Date),
        // then we should deconstruct the object into an array [key1, value1, key2, value2, ...].
        paramValues = Object.entries(param).flat();
    }
    else {
        paramValues = [param];
    }
    const value = paramValues
        .map((p) => {
        if (p === null || p === undefined) {
            return "";
        }
        if (!p.toString || typeof p.toString !== "function") {
            throw new Error(`Query parameters must be able to be represented as string, ${key} can't`);
        }
        const rawValue = p.toISOString !== undefined ? p.toISOString() : p.toString();
        return allowReserved ? rawValue : encodeURIComponent(rawValue);
    })
        .join(separator);
    return `${allowReserved ? key : encodeURIComponent(key)}=${value}`;
}
function appendQueryParams(url, options = {}) {
    var _a, _b, _c, _d;
    if (!options.queryParameters) {
        return url;
    }
    const parsedUrl = new URL(url);
    const queryParams = options.queryParameters;
    const paramStrings = [];
    for (const key of Object.keys(queryParams)) {
        const param = queryParams[key];
        if (param === undefined || param === null) {
            continue;
        }
        const hasMetadata = isQueryParameterWithOptions(param);
        const rawValue = hasMetadata ? param.value : param;
        const explode = hasMetadata ? ((_a = param.explode) !== null && _a !== void 0 ? _a : false) : false;
        const style = hasMetadata && param.style ? param.style : "form";
        if (explode) {
            if (Array.isArray(rawValue)) {
                for (const item of rawValue) {
                    paramStrings.push(getQueryParamValue(key, (_b = options.skipUrlEncoding) !== null && _b !== void 0 ? _b : false, style, item));
                }
            }
            else if (typeof rawValue === "object") {
                // For object explode, the name of the query parameter is ignored and we use the object key instead
                for (const [actualKey, value] of Object.entries(rawValue)) {
                    paramStrings.push(getQueryParamValue(actualKey, (_c = options.skipUrlEncoding) !== null && _c !== void 0 ? _c : false, style, value));
                }
            }
            else {
                // Explode doesn't really make sense for primitives
                throw new Error("explode can only be set to true for objects and arrays");
            }
        }
        else {
            paramStrings.push(getQueryParamValue(key, (_d = options.skipUrlEncoding) !== null && _d !== void 0 ? _d : false, style, rawValue));
        }
    }
    if (parsedUrl.search !== "") {
        parsedUrl.search += "&";
    }
    parsedUrl.search += paramStrings.join("&");
    return parsedUrl.toString();
}
function buildBaseUrl(endpoint, options) {
    var _a;
    if (!options.pathParameters) {
        return endpoint;
    }
    const pathParams = options.pathParameters;
    for (const [key, param] of Object.entries(pathParams)) {
        if (param === undefined || param === null) {
            throw new Error(`Path parameters ${key} must not be undefined or null`);
        }
        if (!param.toString || typeof param.toString !== "function") {
            throw new Error(`Path parameters must be able to be represented as string, ${key} can't`);
        }
        let value = param.toISOString !== undefined ? param.toISOString() : String(param);
        if (!options.skipUrlEncoding) {
            value = encodeURIComponent(param);
        }
        endpoint = (_a = replaceAll(endpoint, `{${key}}`, value)) !== null && _a !== void 0 ? _a : "";
    }
    return endpoint;
}
function buildRoutePath(routePath, pathParameters, options = {}) {
    var _a;
    for (const pathParam of pathParameters) {
        const allowReserved = typeof pathParam === "object" && ((_a = pathParam.allowReserved) !== null && _a !== void 0 ? _a : false);
        let value = typeof pathParam === "object" ? pathParam.value : pathParam;
        if (!options.skipUrlEncoding && !allowReserved) {
            value = encodeURIComponent(value);
        }
        routePath = routePath.replace(/\{[\w-]+\}/, String(value));
    }
    return routePath;
}
/**
 * Replace all of the instances of searchValue in value with the provided replaceValue.
 * @param value - The value to search and replace in.
 * @param searchValue - The value to search for in the value argument.
 * @param replaceValue - The value to replace searchValue with in the value argument.
 * @returns The value where each instance of searchValue was replaced with replacedValue.
 */
function replaceAll(value, searchValue, replaceValue) {
    return !value || !searchValue ? value : value.split(searchValue).join(replaceValue || "");
}

// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.
/**
 * Creates a client with a default pipeline
 * @param endpoint - Base endpoint for the client
 * @param credentials - Credentials to authenticate the requests
 * @param options - Client options
 */
function getClient$1(endpoint, clientOptions = {}) {
    var _a, _b, _c;
    const pipeline = (_a = clientOptions.pipeline) !== null && _a !== void 0 ? _a : createDefaultPipeline$1(clientOptions);
    if ((_b = clientOptions.additionalPolicies) === null || _b === void 0 ? void 0 : _b.length) {
        for (const { policy, position } of clientOptions.additionalPolicies) {
            // Sign happens after Retry and is commonly needed to occur
            // before policies that intercept post-retry.
            const afterPhase = position === "perRetry" ? "Sign" : undefined;
            pipeline.addPolicy(policy, {
                afterPhase,
            });
        }
    }
    const { allowInsecureConnection, httpClient } = clientOptions;
    const endpointUrl = (_c = clientOptions.endpoint) !== null && _c !== void 0 ? _c : endpoint;
    const client = (path, ...args) => {
        const getUrl = (requestOptions) => buildRequestUrl(endpointUrl, path, args, Object.assign({ allowInsecureConnection }, requestOptions));
        return {
            get: (requestOptions = {}) => {
                return buildOperation("GET", getUrl(requestOptions), pipeline, requestOptions, allowInsecureConnection, httpClient);
            },
            post: (requestOptions = {}) => {
                return buildOperation("POST", getUrl(requestOptions), pipeline, requestOptions, allowInsecureConnection, httpClient);
            },
            put: (requestOptions = {}) => {
                return buildOperation("PUT", getUrl(requestOptions), pipeline, requestOptions, allowInsecureConnection, httpClient);
            },
            patch: (requestOptions = {}) => {
                return buildOperation("PATCH", getUrl(requestOptions), pipeline, requestOptions, allowInsecureConnection, httpClient);
            },
            delete: (requestOptions = {}) => {
                return buildOperation("DELETE", getUrl(requestOptions), pipeline, requestOptions, allowInsecureConnection, httpClient);
            },
            head: (requestOptions = {}) => {
                return buildOperation("HEAD", getUrl(requestOptions), pipeline, requestOptions, allowInsecureConnection, httpClient);
            },
            options: (requestOptions = {}) => {
                return buildOperation("OPTIONS", getUrl(requestOptions), pipeline, requestOptions, allowInsecureConnection, httpClient);
            },
            trace: (requestOptions = {}) => {
                return buildOperation("TRACE", getUrl(requestOptions), pipeline, requestOptions, allowInsecureConnection, httpClient);
            },
        };
    };
    return {
        path: client,
        pathUnchecked: client,
        pipeline,
    };
}
function buildOperation(method, url, pipeline, options, allowInsecureConnection, httpClient) {
    var _a;
    allowInsecureConnection = (_a = options.allowInsecureConnection) !== null && _a !== void 0 ? _a : allowInsecureConnection;
    return {
        then: function (onFulfilled, onrejected) {
            return sendRequest(method, url, pipeline, Object.assign(Object.assign({}, options), { allowInsecureConnection }), httpClient).then(onFulfilled, onrejected);
        },
        async asBrowserStream() {
            if (isNodeLike$1) {
                throw new Error("`asBrowserStream` is supported only in the browser environment. Use `asNodeStream` instead to obtain the response body stream. If you require a Web stream of the response in Node, consider using `Readable.toWeb` on the result of `asNodeStream`.");
            }
            else {
                return sendRequest(method, url, pipeline, Object.assign(Object.assign({}, options), { allowInsecureConnection, responseAsStream: true }), httpClient);
            }
        },
        async asNodeStream() {
            if (isNodeLike$1) {
                return sendRequest(method, url, pipeline, Object.assign(Object.assign({}, options), { allowInsecureConnection, responseAsStream: true }), httpClient);
            }
            else {
                throw new Error("`isNodeStream` is not supported in the browser environment. Use `asBrowserStream` to obtain the response body stream.");
            }
        },
    };
}

// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.
/**
 * Creates a totally empty pipeline.
 * Useful for testing or creating a custom one.
 */
function createEmptyPipeline() {
    return createEmptyPipeline$1();
}

// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.
const context = createLoggerContext({
    logLevelEnvVarName: "AZURE_LOG_LEVEL",
    namespace: "azure",
});
/**
 * Creates a logger for use by the Azure SDKs that inherits from `AzureLogger`.
 * @param namespace - The name of the SDK package.
 * @hidden
 */
function createClientLogger(namespace) {
    return context.createClientLogger(namespace);
}

// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.
const logger$1 = createClientLogger("core-rest-pipeline");

// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.
/**
 * A policy that logs all requests and responses.
 * @param options - Options to configure logPolicy.
 */
function logPolicy(options = {}) {
    return logPolicy$1(Object.assign({ logger: logger$1.info }, options));
}

// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.
/**
 * A policy to follow Location headers from the server in order
 * to support server-side redirection.
 * In the browser, this policy is not used.
 * @param options - Options to control policy behavior.
 */
function redirectPolicy(options = {}) {
    return redirectPolicy$1(options);
}

// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.
/**
 * @internal
 */
function getHeaderName() {
    return "User-Agent";
}
/**
 * @internal
 */
async function setPlatformSpecificData(map) {
    if (process$1 && process$1.versions) {
        const versions = process$1.versions;
        if (versions.bun) {
            map.set("Bun", versions.bun);
        }
        else if (versions.deno) {
            map.set("Deno", versions.deno);
        }
        else if (versions.node) {
            map.set("Node", versions.node);
        }
    }
    map.set("OS", `(${os.arch()}-${os.type()}-${os.release()})`);
}

// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.
const SDK_VERSION$1 = "1.20.0";

// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.
function getUserAgentString(telemetryInfo) {
    const parts = [];
    for (const [key, value] of telemetryInfo) {
        const token = value ? `${key}/${value}` : key;
        parts.push(token);
    }
    return parts.join(" ");
}
/**
 * @internal
 */
function getUserAgentHeaderName() {
    return getHeaderName();
}
/**
 * @internal
 */
async function getUserAgentValue(prefix) {
    const runtimeInfo = new Map();
    runtimeInfo.set("core-rest-pipeline", SDK_VERSION$1);
    await setPlatformSpecificData(runtimeInfo);
    const defaultAgent = getUserAgentString(runtimeInfo);
    const userAgentValue = prefix ? `${prefix} ${defaultAgent}` : defaultAgent;
    return userAgentValue;
}

// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.
const UserAgentHeaderName = getUserAgentHeaderName();
/**
 * The programmatic identifier of the userAgentPolicy.
 */
const userAgentPolicyName = "userAgentPolicy";
/**
 * A policy that sets the User-Agent header (or equivalent) to reflect
 * the library version.
 * @param options - Options to customize the user agent value.
 */
function userAgentPolicy(options = {}) {
    const userAgentValue = getUserAgentValue(options.userAgentPrefix);
    return {
        name: userAgentPolicyName,
        async sendRequest(request, next) {
            if (!request.headers.has(UserAgentHeaderName)) {
                request.headers.set(UserAgentHeaderName, await userAgentValue);
            }
            return next(request);
        },
    };
}

// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.
/**
 * This error is thrown when an asynchronous operation has been aborted.
 * Check for this error by testing the `name` that the name property of the
 * error matches `"AbortError"`.
 *
 * @example
 * ```ts
 * const controller = new AbortController();
 * controller.abort();
 * try {
 *   doAsyncWork(controller.signal)
 * } catch (e) {
 *   if (e.name === 'AbortError') {
 *     // handle abort error here.
 *   }
 * }
 * ```
 */
class AbortError extends Error {
    constructor(message) {
        super(message);
        this.name = "AbortError";
    }
}

// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.
/**
 * Creates an abortable promise.
 * @param buildPromise - A function that takes the resolve and reject functions as parameters.
 * @param options - The options for the abortable promise.
 * @returns A promise that can be aborted.
 */
function createAbortablePromise(buildPromise, options) {
    const { cleanupBeforeAbort, abortSignal, abortErrorMsg } = options !== null && options !== void 0 ? options : {};
    return new Promise((resolve, reject) => {
        function rejectOnAbort() {
            reject(new AbortError(abortErrorMsg !== null && abortErrorMsg !== void 0 ? abortErrorMsg : "The operation was aborted."));
        }
        function removeListeners() {
            abortSignal === null || abortSignal === void 0 ? void 0 : abortSignal.removeEventListener("abort", onAbort);
        }
        function onAbort() {
            cleanupBeforeAbort === null || cleanupBeforeAbort === void 0 ? void 0 : cleanupBeforeAbort();
            removeListeners();
            rejectOnAbort();
        }
        if (abortSignal === null || abortSignal === void 0 ? void 0 : abortSignal.aborted) {
            return rejectOnAbort();
        }
        try {
            buildPromise((x) => {
                removeListeners();
                resolve(x);
            }, (x) => {
                removeListeners();
                reject(x);
            });
        }
        catch (err) {
            reject(err);
        }
        abortSignal === null || abortSignal === void 0 ? void 0 : abortSignal.addEventListener("abort", onAbort);
    });
}

// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.
const StandardAbortMessage = "The delay was aborted.";
/**
 * A wrapper for setTimeout that resolves a promise after timeInMs milliseconds.
 * @param timeInMs - The number of milliseconds to be delayed.
 * @param options - The options for delay - currently abort options
 * @returns Promise that is resolved after timeInMs
 */
function delay(timeInMs, options) {
    let token;
    const { abortSignal, abortErrorMsg } = {};
    return createAbortablePromise((resolve) => {
        token = setTimeout(resolve, timeInMs);
    }, {
        cleanupBeforeAbort: () => clearTimeout(token),
        abortSignal,
        abortErrorMsg: abortErrorMsg !== null && abortErrorMsg !== void 0 ? abortErrorMsg : StandardAbortMessage,
    });
}

// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.
/**
 * Given what is thought to be an error object, return the message if possible.
 * If the message is missing, returns a stringified version of the input.
 * @param e - Something thrown from a try block
 * @returns The error message or a string of the input
 */
function getErrorMessage(e) {
    if (isError$1(e)) {
        return e.message;
    }
    else {
        let stringified;
        try {
            if (typeof e === "object" && e) {
                stringified = JSON.stringify(e);
            }
            else {
                stringified = String(e);
            }
        }
        catch (err) {
            stringified = "[unable to stringify input]";
        }
        return `Unknown error ${stringified}`;
    }
}

// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.
/**
 * Helper TypeGuard that checks if something is defined or not.
 * @param thing - Anything
 */
function isDefined(thing) {
    return typeof thing !== "undefined" && thing !== null;
}
/**
 * Helper TypeGuard that checks if the input is an object with the specified properties.
 * @param thing - Anything.
 * @param properties - The name of the properties that should appear in the object.
 */
function isObjectWithProperties(thing, properties) {
    if (!isDefined(thing) || typeof thing !== "object") {
        return false;
    }
    for (const property of properties) {
        if (!objectHasProperty(thing, property)) {
            return false;
        }
    }
    return true;
}
/**
 * Helper TypeGuard that checks if the input is an object with the specified property.
 * @param thing - Any object.
 * @param property - The name of the property that should appear in the object.
 */
function objectHasProperty(thing, property) {
    return (isDefined(thing) && typeof thing === "object" && property in thing);
}

// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.
/**
 * Typeguard for an error object shape (has name and message)
 *
 * @param e - Something caught by a catch clause.
 */
function isError(e) {
    return isError$1(e);
}
/**
 * A constant that indicates whether the environment the code is running is a Node.js compatible environment.
 */
const isNodeLike = isNodeLike$1;

// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.
/**
 * Private symbol used as key on objects created using createFile containing the
 * original source of the file object.
 *
 * This is used in Node to access the original Node stream without using Blob#stream, which
 * returns a web stream. This is done to avoid a couple of bugs to do with Blob#stream and
 * Readable#to/fromWeb in Node versions we support:
 * - https://github.com/nodejs/node/issues/42694 (fixed in Node 18.14)
 * - https://github.com/nodejs/node/issues/48916 (fixed in Node 20.6)
 *
 * Once these versions are no longer supported, we may be able to stop doing this.
 *
 * @internal
 */
const rawContent = Symbol("rawContent");
/**
 * Type guard to check if a given object is a blob-like object with a raw content property.
 */
function hasRawContent(x) {
    return typeof x[rawContent] === "function";
}
/**
 * Extract the raw content from a given blob-like object. If the input was created using createFile
 * or createFileFromStream, the exact content passed into createFile/createFileFromStream will be used.
 * For true instances of Blob and File, returns the actual blob.
 *
 * @internal
 */
function getRawContent(blob) {
    if (hasRawContent(blob)) {
        return blob[rawContent]();
    }
    else {
        return blob;
    }
}

// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.
/**
 * Name of multipart policy
 */
const multipartPolicyName = multipartPolicyName$1;
/**
 * Pipeline policy for multipart requests
 */
function multipartPolicy() {
    const tspPolicy = multipartPolicy$1();
    return {
        name: multipartPolicyName,
        sendRequest: async (request, next) => {
            if (request.multipartBody) {
                for (const part of request.multipartBody.parts) {
                    if (hasRawContent(part.body)) {
                        part.body = getRawContent(part.body);
                    }
                }
            }
            return tspPolicy.sendRequest(request, next);
        },
    };
}

// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.
/**
 * A policy to enable response decompression according to Accept-Encoding header
 * https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Accept-Encoding
 */
function decompressResponsePolicy() {
    return decompressResponsePolicy$1();
}

// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.
/**
 * A policy that retries according to three strategies:
 * - When the server sends a 429 response with a Retry-After header.
 * - When there are errors in the underlying transport layer (e.g. DNS lookup failures).
 * - Or otherwise if the outgoing request fails, it will retry with an exponentially increasing delay.
 */
function defaultRetryPolicy(options = {}) {
    return defaultRetryPolicy$1(options);
}

// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.
/**
 * A policy that encodes FormData on the request into the body.
 */
function formDataPolicy() {
    return formDataPolicy$1();
}

// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.
/**
 * A policy that allows one to apply proxy settings to all requests.
 * If not passed static settings, they will be retrieved from the HTTPS_PROXY
 * or HTTP_PROXY environment variables.
 * @param proxySettings - ProxySettings to use on each request.
 * @param options - additional settings, for example, custom NO_PROXY patterns
 */
function proxyPolicy(proxySettings, options) {
    return proxyPolicy$1(proxySettings);
}

// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.
/**
 * The programmatic identifier of the setClientRequestIdPolicy.
 */
const setClientRequestIdPolicyName = "setClientRequestIdPolicy";
/**
 * Each PipelineRequest gets a unique id upon creation.
 * This policy passes that unique id along via an HTTP header to enable better
 * telemetry and tracing.
 * @param requestIdHeaderName - The name of the header to pass the request ID to.
 */
function setClientRequestIdPolicy(requestIdHeaderName = "x-ms-client-request-id") {
    return {
        name: setClientRequestIdPolicyName,
        async sendRequest(request, next) {
            if (!request.headers.has(requestIdHeaderName)) {
                request.headers.set(requestIdHeaderName, request.requestId);
            }
            return next(request);
        },
    };
}

// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.
/**
 * Gets a pipeline policy that sets http.agent
 */
function agentPolicy(agent) {
    return agentPolicy$1(agent);
}

// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.
/**
 * Gets a pipeline policy that adds the client certificate to the HttpClient agent for authentication.
 */
function tlsPolicy(tlsSettings) {
    return tlsPolicy$1(tlsSettings);
}

// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.
/** @internal */
const knownContextKeys = {
    span: Symbol.for("@azure/core-tracing span"),
    namespace: Symbol.for("@azure/core-tracing namespace"),
};
/**
 * Creates a new {@link TracingContext} with the given options.
 * @param options - A set of known keys that may be set on the context.
 * @returns A new {@link TracingContext} with the given options.
 *
 * @internal
 */
function createTracingContext(options = {}) {
    let context = new TracingContextImpl(options.parentContext);
    if (options.span) {
        context = context.setValue(knownContextKeys.span, options.span);
    }
    if (options.namespace) {
        context = context.setValue(knownContextKeys.namespace, options.namespace);
    }
    return context;
}
/** @internal */
class TracingContextImpl {
    constructor(initialContext) {
        this._contextMap =
            initialContext instanceof TracingContextImpl
                ? new Map(initialContext._contextMap)
                : new Map();
    }
    setValue(key, value) {
        const newContext = new TracingContextImpl(this);
        newContext._contextMap.set(key, value);
        return newContext;
    }
    getValue(key) {
        return this._contextMap.get(key);
    }
    deleteValue(key) {
        const newContext = new TracingContextImpl(this);
        newContext._contextMap.delete(key);
        return newContext;
    }
}

var state$1 = {};

var hasRequiredState;

function requireState () {
	if (hasRequiredState) return state$1;
	hasRequiredState = 1;
	// Copyright (c) Microsoft Corporation.
	// Licensed under the MIT License.
	Object.defineProperty(state$1, "__esModule", { value: true });
	state$1.state = void 0;
	/**
	 * @internal
	 *
	 * Holds the singleton instrumenter, to be shared across CJS and ESM imports.
	 */
	state$1.state = {
	    instrumenterImplementation: undefined,
	};
	
	return state$1;
}

var stateExports = requireState();

// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.
// @ts-expect-error The recommended approach to sharing module state between ESM and CJS.
// See https://github.com/isaacs/tshy/blob/main/README.md#module-local-state for additional information.
/**
 * Defines the shared state between CJS and ESM by re-exporting the CJS state.
 */
const state = stateExports.state;

// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.
function createDefaultTracingSpan() {
    return {
        end: () => {
            // noop
        },
        isRecording: () => false,
        recordException: () => {
            // noop
        },
        setAttribute: () => {
            // noop
        },
        setStatus: () => {
            // noop
        },
        addEvent: () => {
            // noop
        },
    };
}
function createDefaultInstrumenter() {
    return {
        createRequestHeaders: () => {
            return {};
        },
        parseTraceparentHeader: () => {
            return undefined;
        },
        startSpan: (_name, spanOptions) => {
            return {
                span: createDefaultTracingSpan(),
                tracingContext: createTracingContext({ parentContext: spanOptions.tracingContext }),
            };
        },
        withContext(_context, callback, ...callbackArgs) {
            return callback(...callbackArgs);
        },
    };
}
/**
 * Gets the currently set instrumenter, a No-Op instrumenter by default.
 *
 * @returns The currently set instrumenter
 */
function getInstrumenter() {
    if (!state.instrumenterImplementation) {
        state.instrumenterImplementation = createDefaultInstrumenter();
    }
    return state.instrumenterImplementation;
}

// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.
/**
 * Creates a new tracing client.
 *
 * @param options - Options used to configure the tracing client.
 * @returns - An instance of {@link TracingClient}.
 */
function createTracingClient(options) {
    const { namespace, packageName, packageVersion } = options;
    function startSpan(name, operationOptions, spanOptions) {
        var _a;
        const startSpanResult = getInstrumenter().startSpan(name, Object.assign(Object.assign({}, spanOptions), { packageName: packageName, packageVersion: packageVersion, tracingContext: (_a = operationOptions === null || operationOptions === void 0 ? void 0 : operationOptions.tracingOptions) === null || _a === void 0 ? void 0 : _a.tracingContext }));
        let tracingContext = startSpanResult.tracingContext;
        const span = startSpanResult.span;
        if (!tracingContext.getValue(knownContextKeys.namespace)) {
            tracingContext = tracingContext.setValue(knownContextKeys.namespace, namespace);
        }
        span.setAttribute("az.namespace", tracingContext.getValue(knownContextKeys.namespace));
        const updatedOptions = Object.assign({}, operationOptions, {
            tracingOptions: Object.assign(Object.assign({}, operationOptions === null || operationOptions === void 0 ? void 0 : operationOptions.tracingOptions), { tracingContext }),
        });
        return {
            span,
            updatedOptions,
        };
    }
    async function withSpan(name, operationOptions, callback, spanOptions) {
        const { span, updatedOptions } = startSpan(name, operationOptions, spanOptions);
        try {
            const result = await withContext(updatedOptions.tracingOptions.tracingContext, () => Promise.resolve(callback(updatedOptions, span)));
            span.setStatus({ status: "success" });
            return result;
        }
        catch (err) {
            span.setStatus({ status: "error", error: err });
            throw err;
        }
        finally {
            span.end();
        }
    }
    function withContext(context, callback, ...callbackArgs) {
        return getInstrumenter().withContext(context, callback, ...callbackArgs);
    }
    /**
     * Parses a traceparent header value into a span identifier.
     *
     * @param traceparentHeader - The traceparent header to parse.
     * @returns An implementation-specific identifier for the span.
     */
    function parseTraceparentHeader(traceparentHeader) {
        return getInstrumenter().parseTraceparentHeader(traceparentHeader);
    }
    /**
     * Creates a set of request headers to propagate tracing information to a backend.
     *
     * @param tracingContext - The context containing the span to serialize.
     * @returns The set of headers to add to a request.
     */
    function createRequestHeaders(tracingContext) {
        return getInstrumenter().createRequestHeaders(tracingContext);
    }
    return {
        startSpan,
        withSpan,
        withContext,
        parseTraceparentHeader,
        createRequestHeaders,
    };
}

// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.
/**
 * A custom error type for failed pipeline requests.
 */
class RestError extends Error {
    constructor(message, options = {}) {
        super(message);
        // what is this??
        // it turns out that you can return from a constructor and it causes
        // calling `new` to return the value you return.
        // this lets us wrap the TypeSpec RestError so that calling this constructor will give you the same type of object as calling the TypeSpec one,
        // even though the constructor signatures (through RestErrorOptions) are slightly different.
        return new RestError$1(message, options);
    }
}
/**
 * Something went wrong when making the request.
 * This means the actual request failed for some reason,
 * such as a DNS issue or the connection being lost.
 */
RestError.REQUEST_SEND_ERROR = "REQUEST_SEND_ERROR";
/**
 * This means that parsing the response from the server failed.
 * It may have been malformed.
 */
RestError.PARSE_ERROR = "PARSE_ERROR";
/**
 * Typeguard for RestError
 * @param e - Something caught by a catch clause.
 */
function isRestError(e) {
    return isRestError$1(e);
}

// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.
/**
 * The programmatic identifier of the tracingPolicy.
 */
const tracingPolicyName$1 = "tracingPolicy";
/**
 * A simple policy to create OpenTelemetry Spans for each request made by the pipeline
 * that has SpanOptions with a parent.
 * Requests made without a parent Span will not be recorded.
 * @param options - Options to configure the telemetry logged by the tracing policy.
 */
function tracingPolicy$1(options = {}) {
    const userAgentPromise = getUserAgentValue(options.userAgentPrefix);
    const sanitizer = new Sanitizer({
        additionalAllowedQueryParameters: options.additionalAllowedQueryParameters,
    });
    const tracingClient = tryCreateTracingClient();
    return {
        name: tracingPolicyName$1,
        async sendRequest(request, next) {
            var _a;
            if (!tracingClient) {
                return next(request);
            }
            const userAgent = await userAgentPromise;
            const spanAttributes = {
                "http.url": sanitizer.sanitizeUrl(request.url),
                "http.method": request.method,
                "http.user_agent": userAgent,
                requestId: request.requestId,
            };
            if (userAgent) {
                spanAttributes["http.user_agent"] = userAgent;
            }
            const { span, tracingContext } = (_a = tryCreateSpan$1(tracingClient, request, spanAttributes)) !== null && _a !== void 0 ? _a : {};
            if (!span || !tracingContext) {
                return next(request);
            }
            try {
                const response = await tracingClient.withContext(tracingContext, next, request);
                tryProcessResponse$1(span, response);
                return response;
            }
            catch (err) {
                tryProcessError$1(span, err);
                throw err;
            }
        },
    };
}
function tryCreateTracingClient() {
    try {
        return createTracingClient({
            namespace: "",
            packageName: "@azure/core-rest-pipeline",
            packageVersion: SDK_VERSION$1,
        });
    }
    catch (e) {
        logger$1.warning(`Error when creating the TracingClient: ${getErrorMessage(e)}`);
        return undefined;
    }
}
function tryCreateSpan$1(tracingClient, request, spanAttributes) {
    try {
        // As per spec, we do not need to differentiate between HTTP and HTTPS in span name.
        const { span, updatedOptions } = tracingClient.startSpan(`HTTP ${request.method}`, { tracingOptions: request.tracingOptions }, {
            spanKind: "client",
            spanAttributes,
        });
        // If the span is not recording, don't do any more work.
        if (!span.isRecording()) {
            span.end();
            return undefined;
        }
        // set headers
        const headers = tracingClient.createRequestHeaders(updatedOptions.tracingOptions.tracingContext);
        for (const [key, value] of Object.entries(headers)) {
            request.headers.set(key, value);
        }
        return { span, tracingContext: updatedOptions.tracingOptions.tracingContext };
    }
    catch (e) {
        logger$1.warning(`Skipping creating a tracing span due to an error: ${getErrorMessage(e)}`);
        return undefined;
    }
}
function tryProcessError$1(span, error) {
    try {
        span.setStatus({
            status: "error",
            error: isError(error) ? error : undefined,
        });
        if (isRestError(error) && error.statusCode) {
            span.setAttribute("http.status_code", error.statusCode);
        }
        span.end();
    }
    catch (e) {
        logger$1.warning(`Skipping tracing span processing due to an error: ${getErrorMessage(e)}`);
    }
}
function tryProcessResponse$1(span, response) {
    try {
        span.setAttribute("http.status_code", response.status);
        const serviceRequestId = response.headers.get("x-ms-request-id");
        if (serviceRequestId) {
            span.setAttribute("serviceRequestId", serviceRequestId);
        }
        // Per semantic conventions, only set the status to error if the status code is 4xx or 5xx.
        // Otherwise, the status MUST remain unset.
        // https://opentelemetry.io/docs/specs/semconv/http/http-spans/#status
        if (response.status >= 400) {
            span.setStatus({
                status: "error",
            });
        }
        span.end();
    }
    catch (e) {
        logger$1.warning(`Skipping tracing span processing due to an error: ${getErrorMessage(e)}`);
    }
}

// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.
/**
 * Creates a native AbortSignal which reflects the state of the provided AbortSignalLike.
 * If the AbortSignalLike is already a native AbortSignal, it is returned as is.
 * @param abortSignalLike - The AbortSignalLike to wrap.
 * @returns - An object containing the native AbortSignal and an optional cleanup function. The cleanup function should be called when the AbortSignal is no longer needed.
 */
function wrapAbortSignalLike(abortSignalLike) {
    if (abortSignalLike instanceof AbortSignal) {
        return { abortSignal: abortSignalLike };
    }
    if (abortSignalLike.aborted) {
        return { abortSignal: AbortSignal.abort(abortSignalLike.reason) };
    }
    const controller = new AbortController();
    let needsCleanup = true;
    function cleanup() {
        if (needsCleanup) {
            abortSignalLike.removeEventListener("abort", listener);
            needsCleanup = false;
        }
    }
    function listener() {
        controller.abort(abortSignalLike.reason);
        cleanup();
    }
    abortSignalLike.addEventListener("abort", listener);
    return { abortSignal: controller.signal, cleanup };
}

// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.
const wrapAbortSignalLikePolicyName = "wrapAbortSignalLikePolicy";
/**
 * Policy that ensure that any AbortSignalLike is wrapped in a native AbortSignal for processing by the pipeline.
 * Since the ts-http-runtime expects a native AbortSignal, this policy is used to ensure that any AbortSignalLike is wrapped in a native AbortSignal.
 *
 * @returns - created policy
 */
function wrapAbortSignalLikePolicy() {
    return {
        name: wrapAbortSignalLikePolicyName,
        sendRequest: async (request, next) => {
            if (!request.abortSignal) {
                return next(request);
            }
            const { abortSignal, cleanup } = wrapAbortSignalLike(request.abortSignal);
            // eslint-disable-next-line no-param-reassign
            request.abortSignal = abortSignal;
            try {
                return await next(request);
            }
            finally {
                cleanup === null || cleanup === void 0 ? void 0 : cleanup();
            }
        },
    };
}

// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.
/**
 * Create a new pipeline with a default set of customizable policies.
 * @param options - Options to configure a custom pipeline.
 */
function createPipelineFromOptions(options) {
    var _a;
    const pipeline = createEmptyPipeline();
    if (isNodeLike) {
        if (options.agent) {
            pipeline.addPolicy(agentPolicy(options.agent));
        }
        if (options.tlsOptions) {
            pipeline.addPolicy(tlsPolicy(options.tlsOptions));
        }
        pipeline.addPolicy(proxyPolicy(options.proxyOptions));
        pipeline.addPolicy(decompressResponsePolicy());
    }
    pipeline.addPolicy(wrapAbortSignalLikePolicy());
    pipeline.addPolicy(formDataPolicy(), { beforePolicies: [multipartPolicyName] });
    pipeline.addPolicy(userAgentPolicy(options.userAgentOptions));
    pipeline.addPolicy(setClientRequestIdPolicy((_a = options.telemetryOptions) === null || _a === void 0 ? void 0 : _a.clientRequestIdHeaderName));
    // The multipart policy is added after policies with no phase, so that
    // policies can be added between it and formDataPolicy to modify
    // properties (e.g., making the boundary constant in recorded tests).
    pipeline.addPolicy(multipartPolicy(), { afterPhase: "Deserialize" });
    pipeline.addPolicy(defaultRetryPolicy(options.retryOptions), { phase: "Retry" });
    pipeline.addPolicy(tracingPolicy$1(Object.assign(Object.assign({}, options.userAgentOptions), options.loggingOptions)), {
        afterPhase: "Retry",
    });
    if (isNodeLike) {
        // Both XHR and Fetch expect to handle redirects automatically,
        // so only include this policy when we're in Node.
        pipeline.addPolicy(redirectPolicy(options.redirectOptions), { afterPhase: "Retry" });
    }
    pipeline.addPolicy(logPolicy(options.loggingOptions), { afterPhase: "Sign" });
    return pipeline;
}

// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.
// Default options for the cycler if none are provided
const DEFAULT_CYCLER_OPTIONS = {
    forcedRefreshWindowInMs: 1000, // Force waiting for a refresh 1s before the token expires
    retryIntervalInMs: 3000, // Allow refresh attempts every 3s
    refreshWindowInMs: 1000 * 60 * 2, // Start refreshing 2m before expiry
};
/**
 * Converts an an unreliable access token getter (which may resolve with null)
 * into an AccessTokenGetter by retrying the unreliable getter in a regular
 * interval.
 *
 * @param getAccessToken - A function that produces a promise of an access token that may fail by returning null.
 * @param retryIntervalInMs - The time (in milliseconds) to wait between retry attempts.
 * @param refreshTimeout - The timestamp after which the refresh attempt will fail, throwing an exception.
 * @returns - A promise that, if it resolves, will resolve with an access token.
 */
async function beginRefresh(getAccessToken, retryIntervalInMs, refreshTimeout) {
    // This wrapper handles exceptions gracefully as long as we haven't exceeded
    // the timeout.
    async function tryGetAccessToken() {
        if (Date.now() < refreshTimeout) {
            try {
                return await getAccessToken();
            }
            catch (_a) {
                return null;
            }
        }
        else {
            const finalToken = await getAccessToken();
            // Timeout is up, so throw if it's still null
            if (finalToken === null) {
                throw new Error("Failed to refresh access token.");
            }
            return finalToken;
        }
    }
    let token = await tryGetAccessToken();
    while (token === null) {
        await delay(retryIntervalInMs);
        token = await tryGetAccessToken();
    }
    return token;
}
/**
 * Creates a token cycler from a credential, scopes, and optional settings.
 *
 * A token cycler represents a way to reliably retrieve a valid access token
 * from a TokenCredential. It will handle initializing the token, refreshing it
 * when it nears expiration, and synchronizes refresh attempts to avoid
 * concurrency hazards.
 *
 * @param credential - the underlying TokenCredential that provides the access
 * token
 * @param tokenCyclerOptions - optionally override default settings for the cycler
 *
 * @returns - a function that reliably produces a valid access token
 */
function createTokenCycler(credential, tokenCyclerOptions) {
    let refreshWorker = null;
    let token = null;
    let tenantId;
    const options = Object.assign(Object.assign({}, DEFAULT_CYCLER_OPTIONS), tokenCyclerOptions);
    /**
     * This little holder defines several predicates that we use to construct
     * the rules of refreshing the token.
     */
    const cycler = {
        /**
         * Produces true if a refresh job is currently in progress.
         */
        get isRefreshing() {
            return refreshWorker !== null;
        },
        /**
         * Produces true if the cycler SHOULD refresh (we are within the refresh
         * window and not already refreshing)
         */
        get shouldRefresh() {
            var _a;
            if (cycler.isRefreshing) {
                return false;
            }
            if ((token === null || token === void 0 ? void 0 : token.refreshAfterTimestamp) && token.refreshAfterTimestamp < Date.now()) {
                return true;
            }
            return ((_a = token === null || token === void 0 ? void 0 : token.expiresOnTimestamp) !== null && _a !== void 0 ? _a : 0) - options.refreshWindowInMs < Date.now();
        },
        /**
         * Produces true if the cycler MUST refresh (null or nearly-expired
         * token).
         */
        get mustRefresh() {
            return (token === null || token.expiresOnTimestamp - options.forcedRefreshWindowInMs < Date.now());
        },
    };
    /**
     * Starts a refresh job or returns the existing job if one is already
     * running.
     */
    function refresh(scopes, getTokenOptions) {
        var _a;
        if (!cycler.isRefreshing) {
            // We bind `scopes` here to avoid passing it around a lot
            const tryGetAccessToken = () => credential.getToken(scopes, getTokenOptions);
            // Take advantage of promise chaining to insert an assignment to `token`
            // before the refresh can be considered done.
            refreshWorker = beginRefresh(tryGetAccessToken, options.retryIntervalInMs, 
            // If we don't have a token, then we should timeout immediately
            (_a = token === null || token === void 0 ? void 0 : token.expiresOnTimestamp) !== null && _a !== void 0 ? _a : Date.now())
                .then((_token) => {
                refreshWorker = null;
                token = _token;
                tenantId = getTokenOptions.tenantId;
                return token;
            })
                .catch((reason) => {
                // We also should reset the refresher if we enter a failed state.  All
                // existing awaiters will throw, but subsequent requests will start a
                // new retry chain.
                refreshWorker = null;
                token = null;
                tenantId = undefined;
                throw reason;
            });
        }
        return refreshWorker;
    }
    return async (scopes, tokenOptions) => {
        //
        // Simple rules:
        // - If we MUST refresh, then return the refresh task, blocking
        //   the pipeline until a token is available.
        // - If we SHOULD refresh, then run refresh but don't return it
        //   (we can still use the cached token).
        // - Return the token, since it's fine if we didn't return in
        //   step 1.
        //
        const hasClaimChallenge = Boolean(tokenOptions.claims);
        const tenantIdChanged = tenantId !== tokenOptions.tenantId;
        if (hasClaimChallenge) {
            // If we've received a claim, we know the existing token isn't valid
            // We want to clear it so that that refresh worker won't use the old expiration time as a timeout
            token = null;
        }
        // If the tenantId passed in token options is different to the one we have
        // Or if we are in claim challenge and the token was rejected and a new access token need to be issued, we need to
        // refresh the token with the new tenantId or token.
        const mustRefresh = tenantIdChanged || hasClaimChallenge || cycler.mustRefresh;
        if (mustRefresh) {
            return refresh(scopes, tokenOptions);
        }
        if (cycler.shouldRefresh) {
            refresh(scopes, tokenOptions);
        }
        return token;
    };
}

// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.
/**
 * The programmatic identifier of the bearerTokenAuthenticationPolicy.
 */
const bearerTokenAuthenticationPolicyName = "bearerTokenAuthenticationPolicy";
/**
 * Try to send the given request.
 *
 * When a response is received, returns a tuple of the response received and, if the response was received
 * inside a thrown RestError, the RestError that was thrown.
 *
 * Otherwise, if an error was thrown while sending the request that did not provide an underlying response, it
 * will be rethrown.
 */
async function trySendRequest(request, next) {
    try {
        return [await next(request), undefined];
    }
    catch (e) {
        if (isRestError(e) && e.response) {
            return [e.response, e];
        }
        else {
            throw e;
        }
    }
}
/**
 * Default authorize request handler
 */
async function defaultAuthorizeRequest(options) {
    const { scopes, getAccessToken, request } = options;
    // Enable CAE true by default
    const getTokenOptions = {
        abortSignal: request.abortSignal,
        tracingOptions: request.tracingOptions,
        enableCae: true,
    };
    const accessToken = await getAccessToken(scopes, getTokenOptions);
    if (accessToken) {
        options.request.headers.set("Authorization", `Bearer ${accessToken.token}`);
    }
}
/**
 * We will retrieve the challenge only if the response status code was 401,
 * and if the response contained the header "WWW-Authenticate" with a non-empty value.
 */
function isChallengeResponse(response) {
    return response.status === 401 && response.headers.has("WWW-Authenticate");
}
/**
 * Re-authorize the request for CAE challenge.
 * The response containing the challenge is `options.response`.
 * If this method returns true, the underlying request will be sent once again.
 */
async function authorizeRequestOnCaeChallenge(onChallengeOptions, caeClaims) {
    var _a;
    const { scopes } = onChallengeOptions;
    const accessToken = await onChallengeOptions.getAccessToken(scopes, {
        enableCae: true,
        claims: caeClaims,
    });
    if (!accessToken) {
        return false;
    }
    onChallengeOptions.request.headers.set("Authorization", `${(_a = accessToken.tokenType) !== null && _a !== void 0 ? _a : "Bearer"} ${accessToken.token}`);
    return true;
}
/**
 * A policy that can request a token from a TokenCredential implementation and
 * then apply it to the Authorization header of a request as a Bearer token.
 */
function bearerTokenAuthenticationPolicy(options) {
    var _a, _b, _c;
    const { credential, scopes, challengeCallbacks } = options;
    const logger = options.logger || logger$1;
    const callbacks = {
        authorizeRequest: (_b = (_a = challengeCallbacks === null || challengeCallbacks === void 0 ? void 0 : challengeCallbacks.authorizeRequest) === null || _a === void 0 ? void 0 : _a.bind(challengeCallbacks)) !== null && _b !== void 0 ? _b : defaultAuthorizeRequest,
        authorizeRequestOnChallenge: (_c = challengeCallbacks === null || challengeCallbacks === void 0 ? void 0 : challengeCallbacks.authorizeRequestOnChallenge) === null || _c === void 0 ? void 0 : _c.bind(challengeCallbacks),
    };
    // This function encapsulates the entire process of reliably retrieving the token
    // The options are left out of the public API until there's demand to configure this.
    // Remember to extend `BearerTokenAuthenticationPolicyOptions` with `TokenCyclerOptions`
    // in order to pass through the `options` object.
    const getAccessToken = credential
        ? createTokenCycler(credential /* , options */)
        : () => Promise.resolve(null);
    return {
        name: bearerTokenAuthenticationPolicyName,
        /**
         * If there's no challenge parameter:
         * - It will try to retrieve the token using the cache, or the credential's getToken.
         * - Then it will try the next policy with or without the retrieved token.
         *
         * It uses the challenge parameters to:
         * - Skip a first attempt to get the token from the credential if there's no cached token,
         *   since it expects the token to be retrievable only after the challenge.
         * - Prepare the outgoing request if the `prepareRequest` method has been provided.
         * - Send an initial request to receive the challenge if it fails.
         * - Process a challenge if the response contains it.
         * - Retrieve a token with the challenge information, then re-send the request.
         */
        async sendRequest(request, next) {
            if (!request.url.toLowerCase().startsWith("https://")) {
                throw new Error("Bearer token authentication is not permitted for non-TLS protected (non-https) URLs.");
            }
            await callbacks.authorizeRequest({
                scopes: Array.isArray(scopes) ? scopes : [scopes],
                request,
                getAccessToken,
                logger,
            });
            let response;
            let error;
            let shouldSendRequest;
            [response, error] = await trySendRequest(request, next);
            if (isChallengeResponse(response)) {
                let claims = getCaeChallengeClaims(response.headers.get("WWW-Authenticate"));
                // Handle CAE by default when receive CAE claim
                if (claims) {
                    let parsedClaim;
                    // Return the response immediately if claims is not a valid base64 encoded string
                    try {
                        parsedClaim = atob(claims);
                    }
                    catch (e) {
                        logger.warning(`The WWW-Authenticate header contains "claims" that cannot be parsed. Unable to perform the Continuous Access Evaluation authentication flow. Unparsable claims: ${claims}`);
                        return response;
                    }
                    shouldSendRequest = await authorizeRequestOnCaeChallenge({
                        scopes: Array.isArray(scopes) ? scopes : [scopes],
                        response,
                        request,
                        getAccessToken,
                        logger,
                    }, parsedClaim);
                    // Send updated request and handle response for RestError
                    if (shouldSendRequest) {
                        [response, error] = await trySendRequest(request, next);
                    }
                }
                else if (callbacks.authorizeRequestOnChallenge) {
                    // Handle custom challenges when client provides custom callback
                    shouldSendRequest = await callbacks.authorizeRequestOnChallenge({
                        scopes: Array.isArray(scopes) ? scopes : [scopes],
                        request,
                        response,
                        getAccessToken,
                        logger,
                    });
                    // Send updated request and handle response for RestError
                    if (shouldSendRequest) {
                        [response, error] = await trySendRequest(request, next);
                    }
                    // If we get another CAE Claim, we will handle it by default and return whatever value we receive for this
                    if (isChallengeResponse(response)) {
                        claims = getCaeChallengeClaims(response.headers.get("WWW-Authenticate"));
                        if (claims) {
                            let parsedClaim;
                            try {
                                parsedClaim = atob(claims);
                            }
                            catch (e) {
                                logger.warning(`The WWW-Authenticate header contains "claims" that cannot be parsed. Unable to perform the Continuous Access Evaluation authentication flow. Unparsable claims: ${claims}`);
                                return response;
                            }
                            shouldSendRequest = await authorizeRequestOnCaeChallenge({
                                scopes: Array.isArray(scopes) ? scopes : [scopes],
                                response,
                                request,
                                getAccessToken,
                                logger,
                            }, parsedClaim);
                            // Send updated request and handle response for RestError
                            if (shouldSendRequest) {
                                [response, error] = await trySendRequest(request, next);
                            }
                        }
                    }
                }
            }
            if (error) {
                throw error;
            }
            else {
                return response;
            }
        },
    };
}
/**
 * Converts: `Bearer a="b", c="d", Pop e="f", g="h"`.
 * Into: `[ { scheme: 'Bearer', params: { a: 'b', c: 'd' } }, { scheme: 'Pop', params: { e: 'f', g: 'h' } } ]`.
 *
 * @internal
 */
function parseChallenges(challenges) {
    // Challenge regex seperates the string to individual challenges with different schemes in the format `Scheme a="b", c=d`
    // The challenge regex captures parameteres with either quotes values or unquoted values
    const challengeRegex = /(\w+)\s+((?:\w+=(?:"[^"]*"|[^,]*),?\s*)+)/g;
    // Parameter regex captures the claims group removed from the scheme in the format `a="b"` and `c="d"`
    // CAE challenge always have quoted parameters. For more reference, https://learn.microsoft.com/entra/identity-platform/claims-challenge
    const paramRegex = /(\w+)="([^"]*)"/g;
    const parsedChallenges = [];
    let match;
    // Iterate over each challenge match
    while ((match = challengeRegex.exec(challenges)) !== null) {
        const scheme = match[1];
        const paramsString = match[2];
        const params = {};
        let paramMatch;
        // Iterate over each parameter match
        while ((paramMatch = paramRegex.exec(paramsString)) !== null) {
            params[paramMatch[1]] = paramMatch[2];
        }
        parsedChallenges.push({ scheme, params });
    }
    return parsedChallenges;
}
/**
 * Parse a pipeline response and look for a CAE challenge with "Bearer" scheme
 * Return the value in the header without parsing the challenge
 * @internal
 */
function getCaeChallengeClaims(challenges) {
    var _a;
    if (!challenges) {
        return;
    }
    // Find all challenges present in the header
    const parsedChallenges = parseChallenges(challenges);
    return (_a = parsedChallenges.find((x) => x.scheme === "Bearer" && x.params.claims && x.params.error === "insufficient_claims")) === null || _a === void 0 ? void 0 : _a.params.claims;
}

// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.
/**
 * A static-key-based credential that supports updating
 * the underlying key value.
 */
class AzureKeyCredential {
    /**
     * The value of the key to be used in authentication
     */
    get key() {
        return this._key;
    }
    /**
     * Create an instance of an AzureKeyCredential for use
     * with a service client.
     *
     * @param key - The initial value of the key to use in authentication
     */
    constructor(key) {
        if (!key) {
            throw new Error("key must be a non-empty string");
        }
        this._key = key;
    }
    /**
     * Change the value of the key.
     *
     * Updates will take effect upon the next request after
     * updating the key value.
     *
     * @param newKey - The new key value to be used
     */
    update(newKey) {
        this._key = newKey;
    }
}

// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.
/**
 * Tests an object to determine whether it implements KeyCredential.
 *
 * @param credential - The assumed KeyCredential to be tested.
 */
function isKeyCredential$1(credential) {
    return isObjectWithProperties(credential, ["key"]) && typeof credential.key === "string";
}

// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.
/**
 * @internal
 * @param accessToken - Access token
 * @returns Whether a token is bearer type or not
 */
/**
 * Tests an object to determine whether it implements TokenCredential.
 *
 * @param credential - The assumed TokenCredential to be tested.
 */
function isTokenCredential(credential) {
    // Check for an object with a 'getToken' function and possibly with
    // a 'signRequest' function.  We do this check to make sure that
    // a ServiceClientCredentials implementor (like TokenClientCredentials
    // in ms-rest-nodeauth) doesn't get mistaken for a TokenCredential if
    // it doesn't actually implement TokenCredential also.
    const castCredential = credential;
    return (castCredential &&
        typeof castCredential.getToken === "function" &&
        (castCredential.signRequest === undefined || castCredential.getToken.length > 0));
}

// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.
const apiVersionPolicyName = "ApiVersionPolicy";
/**
 * Creates a policy that sets the apiVersion as a query parameter on every request
 * @param options - Client options
 * @returns Pipeline policy that sets the apiVersion as a query parameter on every request
 */
function apiVersionPolicy(options) {
    return {
        name: apiVersionPolicyName,
        sendRequest: (req, next) => {
            // Use the apiVesion defined in request url directly
            // Append one if there is no apiVesion and we have one at client options
            const url = new URL(req.url);
            if (!url.searchParams.get("api-version") && options.apiVersion) {
                req.url = `${req.url}${Array.from(url.searchParams.keys()).length > 0 ? "&" : "?"}api-version=${options.apiVersion}`;
            }
            return next(req);
        },
    };
}

// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.
/**
 * The programmatic identifier of the bearerTokenAuthenticationPolicy.
 */
const keyCredentialAuthenticationPolicyName = "keyCredentialAuthenticationPolicy";
function keyCredentialAuthenticationPolicy(credential, apiKeyHeaderName) {
    return {
        name: keyCredentialAuthenticationPolicyName,
        async sendRequest(request, next) {
            request.headers.set(apiKeyHeaderName, credential.key);
            return next(request);
        },
    };
}

// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.
/**
 * Adds a credential policy to the pipeline if a credential is provided. If none is provided, no policy is added.
 */
function addCredentialPipelinePolicy(pipeline, endpoint, options = {}) {
    var _a, _b, _c, _d;
    const { credential, clientOptions } = options;
    if (!credential) {
        return;
    }
    if (isTokenCredential(credential)) {
        const tokenPolicy = bearerTokenAuthenticationPolicy({
            credential,
            scopes: (_b = (_a = clientOptions === null || clientOptions === void 0 ? void 0 : clientOptions.credentials) === null || _a === void 0 ? void 0 : _a.scopes) !== null && _b !== void 0 ? _b : `${endpoint}/.default`,
        });
        pipeline.addPolicy(tokenPolicy);
    }
    else if (isKeyCredential(credential)) {
        if (!((_c = clientOptions === null || clientOptions === void 0 ? void 0 : clientOptions.credentials) === null || _c === void 0 ? void 0 : _c.apiKeyHeaderName)) {
            throw new Error(`Missing API Key Header Name`);
        }
        const keyPolicy = keyCredentialAuthenticationPolicy(credential, (_d = clientOptions === null || clientOptions === void 0 ? void 0 : clientOptions.credentials) === null || _d === void 0 ? void 0 : _d.apiKeyHeaderName);
        pipeline.addPolicy(keyPolicy);
    }
}
/**
 * Creates a default rest pipeline to re-use accross Rest Level Clients
 */
function createDefaultPipeline(endpoint, credential, options = {}) {
    const pipeline = createPipelineFromOptions(options);
    pipeline.addPolicy(apiVersionPolicy(options));
    addCredentialPipelinePolicy(pipeline, endpoint, { credential, clientOptions: options });
    return pipeline;
}
function isKeyCredential(credential) {
    return credential.key !== undefined;
}

// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.
/**
 * Function to wrap RequestParameters so that we get the legacy onResponse behavior in core-client-rest
 */
function wrapRequestParameters(parameters) {
    if (parameters.onResponse) {
        return Object.assign(Object.assign({}, parameters), { onResponse(rawResponse, error) {
                var _a;
                (_a = parameters.onResponse) === null || _a === void 0 ? void 0 : _a.call(parameters, rawResponse, error, error);
            } });
    }
    return parameters;
}
function getClient(endpoint, credentialsOrPipelineOptions, clientOptions = {}) {
    let credentials;
    if (credentialsOrPipelineOptions) {
        if (isCredential(credentialsOrPipelineOptions)) {
            credentials = credentialsOrPipelineOptions;
        }
        else {
            clientOptions = credentialsOrPipelineOptions !== null && credentialsOrPipelineOptions !== void 0 ? credentialsOrPipelineOptions : {};
        }
    }
    const pipeline = createDefaultPipeline(endpoint, credentials, clientOptions);
    const tspClient = getClient$1(endpoint, Object.assign(Object.assign({}, clientOptions), { pipeline }));
    const client = (path, ...args) => {
        return {
            get: (requestOptions = {}) => {
                return tspClient.path(path, ...args).get(wrapRequestParameters(requestOptions));
            },
            post: (requestOptions = {}) => {
                return tspClient.path(path, ...args).post(wrapRequestParameters(requestOptions));
            },
            put: (requestOptions = {}) => {
                return tspClient.path(path, ...args).put(wrapRequestParameters(requestOptions));
            },
            patch: (requestOptions = {}) => {
                return tspClient.path(path, ...args).patch(wrapRequestParameters(requestOptions));
            },
            delete: (requestOptions = {}) => {
                return tspClient.path(path, ...args).delete(wrapRequestParameters(requestOptions));
            },
            head: (requestOptions = {}) => {
                return tspClient.path(path, ...args).head(wrapRequestParameters(requestOptions));
            },
            options: (requestOptions = {}) => {
                return tspClient.path(path, ...args).options(wrapRequestParameters(requestOptions));
            },
            trace: (requestOptions = {}) => {
                return tspClient.path(path, ...args).trace(wrapRequestParameters(requestOptions));
            },
        };
    };
    return {
        path: client,
        pathUnchecked: client,
        pipeline: tspClient.pipeline,
    };
}
function isCredential(param) {
    return isKeyCredential$1(param) || isTokenCredential(param);
}

// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.
/**
 * THIS IS AN AUTO-GENERATED FILE - DO NOT EDIT!
 *
 * Any changes you make here may be lost.
 *
 * If you need to make changes, please do so in the original source file, \{project-root\}/sources/custom
 */
const logger = createClientLogger("ai-inference");

// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.
/**
 * THIS IS AN AUTO-GENERATED FILE - DO NOT EDIT!
 *
 * Any changes you make here may be lost.
 *
 * If you need to make changes, please do so in the original source file, \{project-root\}/sources/custom
 */
const SDK_VERSION = "1.0.0-beta.4";

// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.
/*
* Add event to span.  Sample:
    {
    name: 'gen_ai.user.message',
    attributes: {
      'gen_ai.system': 'INFERENCE_GEN_AI_SYSTEM_NAME',
      'gen_ai.event.content': `{"role":"user","content":"What's the weather like in Boston?"}`
    },
    time: [ 1725666879, 622695900 ],
    droppedAttributesCount: 0
  },
*/
/*
* Add event to span.  Sample:
{
  name: 'gen_ai.choice',
  attributes: {
    'gen_ai.system': 'INFERENCE_GEN_AI_SYSTEM_NAME',
    'gen_ai.event.content': '{"finish_reason":"tool_calls","index":0,"message":{"content":""}}'
  },
  time: [ 1725666881, 780608000 ],
  droppedAttributesCount: 0
}
*/
var TracingAttributesEnum;
(function (TracingAttributesEnum) {
    TracingAttributesEnum["Operation_Name"] = "gen_ai.operation.name";
    TracingAttributesEnum["Request_Model"] = "gen_ai.request.model";
    TracingAttributesEnum["System"] = "gen_ai.system";
    TracingAttributesEnum["Error_Type"] = "error.type";
    TracingAttributesEnum["Server_Port"] = "server.port";
    TracingAttributesEnum["Request_Frequency_Penalty"] = "gen_ai.request.frequency_penalty";
    TracingAttributesEnum["Request_Max_Tokens"] = "gen_ai.request.max_tokens";
    TracingAttributesEnum["Request_Presence_Penalty"] = "gen_ai.request.presence_penalty";
    TracingAttributesEnum["Request_Stop_Sequences"] = "gen_ai.request.stop_sequences";
    TracingAttributesEnum["Request_Temperature"] = "gen_ai.request.temperature";
    TracingAttributesEnum["Request_Top_P"] = "gen_ai.request.top_p";
    TracingAttributesEnum["Response_Finish_Reasons"] = "gen_ai.response.finish_reasons";
    TracingAttributesEnum["Response_Id"] = "gen_ai.response.id";
    TracingAttributesEnum["Response_Model"] = "gen_ai.response.model";
    TracingAttributesEnum["Usage_Input_Tokens"] = "gen_ai.usage.input_tokens";
    TracingAttributesEnum["Usage_Output_Tokens"] = "gen_ai.usage.output_tokens";
    TracingAttributesEnum["Server_Address"] = "server.address";
})(TracingAttributesEnum || (TracingAttributesEnum = {}));
const INFERENCE_GEN_AI_SYSTEM_NAME = "az.ai.inference";
const isContentRecordingEnabled = () => envVarToBoolean("AZURE_TRACING_GEN_AI_CONTENT_RECORDING_ENABLED");
function getRequestBody(request) {
    return { body: JSON.parse(request.body) };
}
function getSpanName(request) {
    var _a;
    const { body } = getRequestBody(request);
    return `chat ${(_a = body === null || body === void 0 ? void 0 : body.model) !== null && _a !== void 0 ? _a : ""}`.trim();
}
function onStartTracing(span, request, url) {
    if (!span.isRecording()) {
        return;
    }
    const urlObj = new URL(url);
    const port = Number(urlObj.port) || (urlObj.protocol === "https:" ? undefined : 80);
    if (port) {
        span.setAttribute(TracingAttributesEnum.Server_Port, port);
    }
    span.setAttribute(TracingAttributesEnum.Server_Address, urlObj.hostname);
    span.setAttribute(TracingAttributesEnum.Operation_Name, "chat");
    span.setAttribute(TracingAttributesEnum.System, "az.ai.inference");
    const { body } = getRequestBody(request);
    if (!body)
        return;
    span.setAttribute(TracingAttributesEnum.Request_Model, body.model);
    span.setAttribute(TracingAttributesEnum.Request_Frequency_Penalty, body.frequency_penalty);
    span.setAttribute(TracingAttributesEnum.Request_Max_Tokens, body.max_tokens);
    span.setAttribute(TracingAttributesEnum.Request_Presence_Penalty, body.presence_penalty);
    span.setAttribute(TracingAttributesEnum.Request_Stop_Sequences, body.stop);
    span.setAttribute(TracingAttributesEnum.Request_Temperature, body.temperature);
    span.setAttribute(TracingAttributesEnum.Request_Top_P, body.top_p);
    if (body.messages) {
        addRequestChatMessageEvent(span, body.messages);
    }
}
function tryProcessResponse(span, response) {
    var _a, _b, _c;
    if (!span.isRecording()) {
        return;
    }
    if (response === null || response === void 0 ? void 0 : response.bodyAsText) {
        const body = JSON.parse(response.bodyAsText);
        if ((_a = body.error) !== null && _a !== void 0 ? _a : body.message) {
            span.setAttribute(TracingAttributesEnum.Error_Type, `${(_b = body.status) !== null && _b !== void 0 ? _b : body.statusCode}`);
            span.setStatus({
                status: "error",
                error: (_c = body.error) !== null && _c !== void 0 ? _c : body.message, // message is not in the schema of the response, but it can present if there is crediential error
            });
        }
        span.setAttribute(TracingAttributesEnum.Response_Id, body.id);
        span.setAttribute(TracingAttributesEnum.Response_Model, body.model);
        if (body.choices) {
            span.setAttribute(TracingAttributesEnum.Response_Finish_Reasons, body.choices.map((choice) => choice.finish_reason).join(","));
        }
        if (body.usage) {
            span.setAttribute(TracingAttributesEnum.Usage_Input_Tokens, body.usage.prompt_tokens);
            span.setAttribute(TracingAttributesEnum.Usage_Output_Tokens, body.usage.completion_tokens);
        }
        addResponseChatMessageEvent(span, body);
    }
}
function tryProcessError(span, error) {
    span.setStatus({
        status: "error",
        error: isError(error) ? error : undefined,
    });
}
function addRequestChatMessageEvent(span, messages) {
    messages.forEach((message) => {
        var _a;
        if (message.role) {
            const content = {};
            const chatMsg = message;
            if (chatMsg.content) {
                content.content = chatMsg.content;
            }
            if (!isContentRecordingEnabled()) {
                content.content = "";
            }
            const assistantMsg = message;
            if (assistantMsg.tool_calls) {
                content.tool_calls = assistantMsg.tool_calls;
                if (!isContentRecordingEnabled()) {
                    const toolCalls = JSON.parse(JSON.stringify(content.tool_calls));
                    toolCalls.forEach((toolCall) => {
                        if (toolCall.function.arguments) {
                            toolCall.function.arguments = "";
                        }
                        toolCall.function.name = "";
                    });
                    content.tool_calls = toolCalls;
                }
            }
            const toolMsg = message;
            if (toolMsg.tool_call_id) {
                content.id = toolMsg.tool_call_id;
            }
            (_a = span.addEvent) === null || _a === void 0 ? void 0 : _a.call(span, `gen_ai.${message.role}.message`, {
                attributes: {
                    "gen_ai.system": INFERENCE_GEN_AI_SYSTEM_NAME,
                    "gen_ai.event.content": JSON.stringify(content),
                },
            });
        }
    });
}
function addResponseChatMessageEvent(span, body) {
    var _a;
    if (!span.addEvent) {
        return;
    }
    (_a = body === null || body === void 0 ? void 0 : body.choices) === null || _a === void 0 ? void 0 : _a.forEach((choice) => {
        var _a;
        let message = {};
        if (choice.message.content) {
            message.content = choice.message.content;
        }
        if (choice.message.tool_calls) {
            message.toolCalls = choice.message.tool_calls;
        }
        if (!isContentRecordingEnabled()) {
            message = JSON.parse(JSON.stringify(message));
            message.content = "";
            if (message.toolCalls) {
                message.toolCalls.forEach((toolCall) => {
                    if (toolCall.function.arguments) {
                        toolCall.function.arguments = "";
                    }
                    toolCall.function.name = "";
                });
            }
        }
        const response = {
            finish_reason: choice.finish_reason,
            index: choice.index,
            message,
        };
        const attributes = {
            "gen_ai.system": INFERENCE_GEN_AI_SYSTEM_NAME,
            "gen_ai.event.content": JSON.stringify(response),
        };
        (_a = span.addEvent) === null || _a === void 0 ? void 0 : _a.call(span, "gen_ai.choice", { attributes });
    });
}
function envVarToBoolean(key) {
    var _a;
    const value = (_a = process.env[key]) !== null && _a !== void 0 ? _a : process.env[key.toLowerCase()];
    return value !== "false" && value !== "0" && Boolean(value);
}

// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.
/**
 * The programmatic identifier of the tracingPolicy.
 */
const tracingPolicyName = "inferenceTracingPolicy";
/**
 * A simple policy to create OpenTelemetry Spans for each request made by the pipeline
 * that has SpanOptions with a parent.
 * Requests made without a parent Span will not be recorded.
 */
function tracingPolicy() {
    const tracingClient = createTracingClient({
        namespace: "Microsoft.CognitiveServices",
        packageName: "@azure/ai-inference-rest",
        packageVersion: SDK_VERSION,
    });
    return {
        name: tracingPolicyName,
        async sendRequest(request, next) {
            var _a, _b, _c, _d;
            const url = new URL(request.url);
            if (!tracingClient ||
                !url.href.endsWith("/chat/completions") ||
                ((_b = (_a = getRequestBody(request)) === null || _a === void 0 ? void 0 : _a.body) === null || _b === void 0 ? void 0 : _b.stream)) {
                return next(request);
            }
            const { span, tracingContext } = (_c = tryCreateSpan(tracingClient, request)) !== null && _c !== void 0 ? _c : {};
            if (!span || !tracingContext) {
                return next(request);
            }
            try {
                (_d = request.tracingOptions) !== null && _d !== void 0 ? _d : (request.tracingOptions = {});
                request.tracingOptions.tracingContext = tracingContext;
                onStartTracing(span, request, request.url);
                const response = await tracingClient.withContext(tracingContext, next, request);
                tryProcessResponse(span, response);
                return response;
            }
            catch (err) {
                tryProcessError(span, err);
                throw err;
            }
            finally {
                span.end();
            }
        },
    };
}
function tryCreateSpan(tracingClient, request) {
    try {
        // As per spec, we do not need to differentiate between HTTP and HTTPS in span name.
        const { span, updatedOptions } = tracingClient.startSpan(getSpanName(request), { tracingOptions: request.tracingOptions }, {
            spanKind: "client",
        });
        return { span, tracingContext: updatedOptions.tracingOptions.tracingContext };
    }
    catch (e) {
        logger.warning(`Skipping creating a tracing span due to an error: ${getErrorMessage(e)}`);
        return undefined;
    }
}

// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.
/**
 * Initialize a new instance of `ModelClient`
 * @param endpointParam - The parameter endpointParam
 * @param credentials - uniquely identify client credential
 * @param options - the parameter for all optional parameters
 */
function createClient(endpointParam, credentials, _a = {}) {
    var _b, _c, _d, _e, _f, _g, _h, _j;
    var { apiVersion = "2024-05-01-preview" } = _a, options = __rest(_a, ["apiVersion"]);
    const endpointUrl = (_c = (_b = options.endpoint) !== null && _b !== void 0 ? _b : options.baseUrl) !== null && _c !== void 0 ? _c : `${endpointParam}`;
    const userAgentInfo = `azsdk-js-ai-inference-rest/1.0.0-beta.6`;
    const userAgentPrefix = options.userAgentOptions && options.userAgentOptions.userAgentPrefix
        ? `${options.userAgentOptions.userAgentPrefix} ${userAgentInfo}`
        : `${userAgentInfo}`;
    options = Object.assign(Object.assign({}, options), { userAgentOptions: {
            userAgentPrefix,
        }, loggingOptions: {
            logger: (_e = (_d = options.loggingOptions) === null || _d === void 0 ? void 0 : _d.logger) !== null && _e !== void 0 ? _e : logger.info,
        }, credentials: {
            scopes: (_g = (_f = options.credentials) === null || _f === void 0 ? void 0 : _f.scopes) !== null && _g !== void 0 ? _g : ["https://ml.azure.com/.default"],
            apiKeyHeaderName: (_j = (_h = options.credentials) === null || _h === void 0 ? void 0 : _h.apiKeyHeaderName) !== null && _j !== void 0 ? _j : "api-key",
        } });
    const client = getClient(endpointUrl, credentials, options);
    client.pipeline.removePolicy({ name: "ApiVersionPolicy" });
    client.pipeline.addPolicy({
        name: "InferenceTracingPolicy",
        sendRequest: (req, next) => {
            return tracingPolicy().sendRequest(req, next);
        },
    });
    client.pipeline.addPolicy({
        name: "ClientApiVersionPolicy",
        sendRequest: (req, next) => {
            // Use the apiVersion defined in request url directly
            // Append one if there is no apiVersion and we have one at client options
            const url = new URL(req.url);
            if (!url.searchParams.get("api-version") && apiVersion) {
                req.url = `${req.url}${Array.from(url.searchParams.keys()).length > 0 ? "&" : "?"}api-version=${apiVersion}`;
            }
            return next(req);
        },
    });
    if (isKeyCredential$1(credentials)) {
        client.pipeline.addPolicy({
            name: "customKeyCredentialPolicy",
            async sendRequest(request, next) {
                request.headers.set("Authorization", "Bearer " + credentials.key);
                return next(request);
            },
        });
    }
    return client;
}

// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.
const responseMap = {
    "POST /chat/completions": ["200"],
    "GET /info": ["200"],
    "POST /embeddings": ["200"],
    "POST /images/embeddings": ["200"],
};
function isUnexpected(response) {
    const lroOriginal = response.headers["x-ms-original-url"];
    const url = new URL(lroOriginal !== null && lroOriginal !== void 0 ? lroOriginal : response.request.url);
    const method = response.request.method;
    let pathDetails = responseMap[`${method} ${url.pathname}`];
    if (!pathDetails) {
        pathDetails = getParametrizedPathSuccess(method, url.pathname);
    }
    return !pathDetails.includes(response.status);
}
function getParametrizedPathSuccess(method, path) {
    var _a, _b, _c, _d;
    const pathParts = path.split("/");
    let matchedLen = -1, matchedValue = [];
    for (const [key, value] of Object.entries(responseMap)) {
        // Extracting the path from the map key which is in format
        // GET /path/foo
        if (!key.startsWith(method)) {
            continue;
        }
        const candidatePath = getPathFromMapKey(key);
        // Get each part of the url path
        const candidateParts = candidatePath.split("/");
        // track if we have found a match to return the values found.
        let found = true;
        for (let i = candidateParts.length - 1, j = pathParts.length - 1; i >= 1 && j >= 1; i--, j--) {
            if (((_a = candidateParts[i]) === null || _a === void 0 ? void 0 : _a.startsWith("{")) && ((_b = candidateParts[i]) === null || _b === void 0 ? void 0 : _b.indexOf("}")) !== -1) {
                const start = candidateParts[i].indexOf("}") + 1, end = (_c = candidateParts[i]) === null || _c === void 0 ? void 0 : _c.length;
                // If the current part of the candidate is a "template" part
                // Try to use the suffix of pattern to match the path
                // {guid} ==> $
                // {guid}:export ==> :export$
                const isMatched = new RegExp(`${(_d = candidateParts[i]) === null || _d === void 0 ? void 0 : _d.slice(start, end)}`).test(pathParts[j] || "");
                if (!isMatched) {
                    found = false;
                    break;
                }
                continue;
            }
            // If the candidate part is not a template and
            // the parts don't match mark the candidate as not found
            // to move on with the next candidate path.
            if (candidateParts[i] !== pathParts[j]) {
                found = false;
                break;
            }
        }
        // We finished evaluating the current candidate parts
        // Update the matched value if and only if we found the longer pattern
        if (found && candidatePath.length > matchedLen) {
            matchedLen = candidatePath.length;
            matchedValue = value;
        }
    }
    return matchedValue;
}
function getPathFromMapKey(mapKey) {
    const pathStart = mapKey.indexOf("/");
    return mapKey.slice(pathStart);
}

/**
 * Helper function to load content from a file or use fallback input
 * @param filePathInput - Input name for the file path
 * @param contentInput - Input name for the direct content
 * @param defaultValue - Default value to use if neither file nor content is provided
 * @returns The loaded content
 */
function loadContentFromFileOrInput(filePathInput, contentInput, defaultValue) {
    const filePath = core.getInput(filePathInput);
    const contentString = core.getInput(contentInput);
    if (filePath !== undefined && filePath !== '') {
        if (!fs.existsSync(filePath)) {
            throw new Error(`File for ${filePathInput} was not found: ${filePath}`);
        }
        return fs.readFileSync(filePath, 'utf-8');
    }
    else if (contentString !== undefined && contentString !== '') {
        return contentString;
    }
    else if (defaultValue !== undefined) {
        return defaultValue;
    }
    else {
        throw new Error(`Neither ${filePathInput} nor ${contentInput} was set`);
    }
}
/**
 * Helper function to handle unexpected responses from AI service
 * @param response - The response object from the AI service
 * @throws Error with appropriate error message based on response content
 */
function handleUnexpectedResponse(response) {
    // Extract x-ms-error-code from headers if available
    const errorCode = response.headers['x-ms-error-code'];
    const errorCodeMsg = errorCode ? ` (error code: ${errorCode})` : '';
    // Check if response body exists and contains error details
    if (response.body && response.body.error) {
        throw response.body.error;
    }
    // Handle case where response body is missing
    if (!response.body) {
        throw new Error(`Failed to get response from AI service (status: ${response.status})${errorCodeMsg}. ` +
            'Please check network connection and endpoint configuration.');
    }
    // Handle other error cases
    throw new Error(`AI service returned error response (status: ${response.status})${errorCodeMsg}: ` +
        (typeof response.body === 'string'
            ? response.body
            : JSON.stringify(response.body)));
}

/**
 * Simple one-shot inference without tools
 */
async function simpleInference(request) {
    core.info('Running simple inference without tools');
    const client = createClient(request.endpoint, new AzureKeyCredential(request.token), {
        userAgentOptions: { userAgentPrefix: 'github-actions-ai-inference' }
    });
    const requestBody = {
        messages: [
            {
                role: 'system',
                content: request.systemPrompt
            },
            { role: 'user', content: request.prompt }
        ],
        max_tokens: request.maxTokens,
        model: request.modelName
    };
    const response = await client.path('/chat/completions').post({
        body: requestBody
    });
    if (isUnexpected(response)) {
        handleUnexpectedResponse(response);
    }
    const modelResponse = response.body.choices[0].message.content;
    core.info(`Model response: ${modelResponse || 'No response content'}`);
    return modelResponse;
}
/**
 * GitHub MCP-enabled inference with tool execution loop
 */
async function mcpInference(request, githubMcpClient) {
    core.info('Running GitHub MCP inference with tools');
    const client = createClient(request.endpoint, new AzureKeyCredential(request.token), {
        userAgentOptions: { userAgentPrefix: 'github-actions-ai-inference' }
    });
    // Start with the initial conversation
    const messages = [
        {
            role: 'system',
            content: request.systemPrompt
        },
        { role: 'user', content: request.prompt }
    ];
    let iterationCount = 0;
    const maxIterations = 5; // Prevent infinite loops
    while (iterationCount < maxIterations) {
        iterationCount++;
        core.info(`MCP inference iteration ${iterationCount}`);
        const requestBody = {
            messages: messages,
            max_tokens: request.maxTokens,
            model: request.modelName,
            tools: githubMcpClient.tools
        };
        const response = await client.path('/chat/completions').post({
            body: requestBody
        });
        if (isUnexpected(response)) {
            handleUnexpectedResponse(response);
        }
        const assistantMessage = response.body.choices[0].message;
        const modelResponse = assistantMessage.content;
        const toolCalls = assistantMessage.tool_calls;
        core.info(`Model response: ${modelResponse || 'No response content'}`);
        messages.push({
            role: 'assistant',
            content: modelResponse || '',
            ...(toolCalls && { tool_calls: toolCalls })
        });
        if (!toolCalls || toolCalls.length === 0) {
            core.info('No tool calls requested, ending GitHub MCP inference loop');
            return modelResponse;
        }
        core.info(`Model requested ${toolCalls.length} tool calls`);
        // Execute all tool calls via GitHub MCP
        const toolResults = await executeToolCalls(githubMcpClient.client, toolCalls);
        // Add tool results to the conversation
        messages.push(...toolResults);
        core.info('Tool results added, continuing conversation...');
    }
    core.warning(`GitHub MCP inference loop exceeded maximum iterations (${maxIterations})`);
    // Return the last assistant message content
    const lastAssistantMessage = messages
        .slice()
        .reverse()
        .find((msg) => msg.role === 'assistant');
    return lastAssistantMessage?.content || null;
}

const RESPONSE_FILE = 'modelResponse.txt';
/**
 * The main function for the action.
 *
 * @returns Resolves when the action is complete.
 */
async function run() {
    try {
        const prompt = loadContentFromFileOrInput('prompt-file', 'prompt');
        const systemPrompt = loadContentFromFileOrInput('system-prompt-file', 'system-prompt', 'You are a helpful assistant');
        const modelName = core.getInput('model');
        const maxTokens = parseInt(core.getInput('max-tokens'), 10);
        const token = process.env['GITHUB_TOKEN'] || core.getInput('token');
        if (token === undefined) {
            throw new Error('GITHUB_TOKEN is not set');
        }
        const endpoint = core.getInput('endpoint');
        const enableMcp = core.getBooleanInput('enable-github-mcp') || false;
        const inferenceRequest = {
            systemPrompt,
            prompt,
            modelName,
            maxTokens,
            endpoint,
            token
        };
        let modelResponse = null;
        if (enableMcp) {
            const mcpClient = await connectToGitHubMCP(token);
            if (mcpClient) {
                modelResponse = await mcpInference(inferenceRequest, mcpClient);
            }
            else {
                core.warning('MCP connection failed, falling back to simple inference');
                modelResponse = await simpleInference(inferenceRequest);
            }
        }
        else {
            modelResponse = await simpleInference(inferenceRequest);
        }
        core.setOutput('response', modelResponse || '');
        const responseFilePath = path.join(tempDir(), RESPONSE_FILE);
        core.setOutput('response-file', responseFilePath);
        if (modelResponse && modelResponse !== '') {
            fs.writeFileSync(responseFilePath, modelResponse, 'utf-8');
        }
    }
    catch (error) {
        if (error instanceof Error) {
            core.setFailed(error.message);
        }
        else {
            core.setFailed('An unexpected error occurred');
        }
    }
}
function tempDir() {
    const tempDirectory = process.env['RUNNER_TEMP'] || require$$0.tmpdir();
    return tempDirectory;
}

/**
 * The entrypoint for the action. This file simply imports and runs the action's
 * main logic.
 */
/* istanbul ignore next */
run();
//# sourceMappingURL=index.js.map
