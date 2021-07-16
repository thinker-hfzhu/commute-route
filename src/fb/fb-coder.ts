import { flatbuffers } from "flatbuffers";
import { relative } from "path";
import { reflection } from "./reflection_generated";

/**
 * 
 * 1. flatc --binary --schema *.fbs
 *    -> *.bfbs
 */

export class FlatBufferCoder {
    
    /**
     * 
     * @param bytes 
     */
    constructor(bytes: Uint8Array) {
        this.schema = this.buildSchema(bytes);
    };

    /**
     * json object to flatbuffer binary
     * 
     * @param object 
     */
    encode(object: any): Uint8Array {
        var builder = new flatbuffers.Builder();
        var offset = this.encodeTable(builder, this.schema.rootTable, object);
        builder.finish(offset, this.schema.fileIndentifier);  // , this.schema.fileIndent "resp"
        return builder.asUint8Array();
    };

    /**
     * flatbuffer binary to json object 
     * 
     * @param bytes 
     */
    decode(bytes: Uint8Array): any {
        var buffer = new flatbuffers.ByteBuffer(bytes);

        return  this.decodeTable(buffer, buffer.readInt32(buffer.position()) + buffer.position(), 
                                        this.schema.rootTable);
    };

    /**
     * only for dt.RouteResponse
     */
     beautify(object: any, format: string, tableDef = this.schema.rootTable): any {
        for (let i = 0; i < tableDef.fieldDefs.length; i++) {
            let fieldDef = tableDef.fieldDefs[i];
            if (!object[fieldDef.name] || Object.keys(object).length === 0) {
                delete object[fieldDef.name];
                continue;
            }
    
            var typeDef = fieldDef.typeDef;

            if (typeDef.baseType == reflection.BaseType.Vector) {
                let value = object[fieldDef.name];  
                if (!value.length) {
                    delete object[fieldDef.name];
                    continue;
                }

                if (typeDef.element == reflection.BaseType.Obj) {
                    let elementDef = this.schema.tableDefs[typeDef.index];

                    for (let i = 0; i < value.length; i++) { 
                        this.beautify(value[i], format, elementDef);
                    }
                }
            } else {
                this.beautifyValue(object, format, fieldDef);
            }
        }

        return object;
    } 

    private beautifyValue(object: any, format: string, fieldDef: FieldDef) {
        let typeDef = fieldDef.typeDef;
        let value = object[fieldDef.name];
        
        switch(typeDef.baseType) {
            case reflection.BaseType.Float:
                object[fieldDef.name] = +value.toFixed(4);
                break;
            case reflection.BaseType.Double:
                object[fieldDef.name] = +value.toFixed(6);
                break;
            case reflection.BaseType.Obj:
                var nestedTableDef = this.schema.tableDefs[typeDef.index];

                if (nestedTableDef.fieldDefs.length == 2 && 'lower' in value && 'upper' in value) {
                    if (value.upper.high == 0 && value.upper.low == 0 && value.lower.high == 0 && value.lower.low == 0) {
                        delete object[fieldDef.name];
                    } else if (format == 'jsons') {
                        object[fieldDef.name] = this.toString(value.lower) + '|' + this.toString(value.upper);
                    } else {
                        object[fieldDef.name] = [value.lower.low, value.lower.high, value.upper.low, value.upper.high];
                    }
                } else {
                    this.beautify(value, format, nestedTableDef);
                }

                if (Object.keys(value).length == 0) {
                    delete object[fieldDef.name];
                }

                break;
        }
    }

    private toString(flong: flatbuffers.Long): string {
        let value = (BigInt(flong.high >>> 0) << 32n) | BigInt(flong.low >>> 0);
        return value.toString();
    }

    private schema: Schema;

    /* =========== build schema  =========== */

    private buildSchema(bytes: Uint8Array): Schema {
        var buffer = new flatbuffers.ByteBuffer(bytes);
        var schemaRef = reflection.Schema.getRootAsSchema(buffer);

        var schema = {
            fileIndentifier: schemaRef.fileIdent(),
            fileExtension: schemaRef.fileExt(),
            rootTable: this.buildTableDef(schemaRef.rootTable()),
            tableDefs: [],
            enumDefs: [],
        }

        for (var i = 0; i < schemaRef.objectsLength(); i++) {
            schema.tableDefs.push(this.buildTableDef(schemaRef.objects(i)));
        }

        for (var i = 0; i < schemaRef.enumsLength(); i++) {
            schema.enumDefs.push(this.buildEnumDef(schemaRef.enums(i)));
        }

        return schema;
    }

    private buildTableDef(objRef: reflection.Object): TableDef {
        var tableDef = {
            name: objRef.name(),
            isStruct: objRef.isStruct(),
            minalign: objRef.minalign(),
            bytesize: objRef.bytesize(),
            fieldDefs: [],
        };
        
        for (var i = 0; i < objRef.fieldsLength(); i++) {
            var fieldRef = objRef.fields(i);
            var typeRef = fieldRef.type();

            var typeDef = {
                baseType: typeRef.baseType(),
                element: typeRef.element(),
                index: typeRef.index(),
            };
            
            tableDef.fieldDefs.push({
                name: fieldRef.name(),
                typeDef: typeDef,
                id: fieldRef.id(),
                offset: fieldRef.offset(),
                deprecated: fieldRef.deprecated(),
                required: fieldRef.required(),
                key: fieldRef.key(),
                default: this.buildValue(fieldRef.defaultInteger(), fieldRef.defaultReal(), typeDef.baseType),
            });
        }

        tableDef.fieldDefs.sort(function (a, b) {
            return a.id - b.id;
        });

        return tableDef;
    }

    private buildEnumDef(enumRef: reflection.Enum): EnumDef {
        var typeRef = enumRef.underlyingType();

        var typeDef = {
            baseType: typeRef.baseType(),
            element: typeRef.element(),
            index: typeRef.index(),
        };

        var enumDef = {
            name: enumRef.name(),
            isUnion: enumRef.isUnion(),
            underlyingType: typeDef,
            byName: [],
            byValue: []
        };

        for (var i = 0; i < enumRef.valuesLength(); i++) {
            var enumVal = enumRef.values(i);
            var objRef = enumVal.object();

            var valueDef = {
                name: enumVal.name(),
                value: this.buildValue(enumVal.value(), 0, typeDef.baseType),
                tableDef: objRef === null ? null : this.buildTableDef(objRef),
            }

            enumDef.byName[valueDef.name] = valueDef;
            enumDef.byValue[valueDef.value] = valueDef;
        }
     
        return enumDef;
    }

    private buildValue(flong: flatbuffers.Long, real: number, baseType: reflection.BaseType): any {
        switch (baseType) {
            case reflection.BaseType.Bool: 
                return !!flong.low;
            case reflection.BaseType.Byte: 
                return flong.low << 24 >> 24;
            case reflection.BaseType.UByte: 
            case reflection.BaseType.UType: 
                return flong.low & 0xFF;
            case reflection.BaseType.Short: 
                return flong.low << 16 >> 16;
            case reflection.BaseType.UShort: 
                return flong.low & 0xFFFF;
            case reflection.BaseType.Int: 
                return flong.low | 0;
            case reflection.BaseType.UInt: 
                return flong.low >>> 0;
            case reflection.BaseType.Long: 
                return { low: flong.low | 0, high: flong.high | 0 };
            case reflection.BaseType.ULong: 
                return { low: flong.low >>> 0, high: flong.high >>> 0 };
            case reflection.BaseType.Float: 
            case reflection.BaseType.Double: 
                return real;
            case reflection.BaseType.Vector: 
                return [];
            default:
                return 0;  
        }
    }

    /* =========== encode json object  =========== */

    private encodeTable(builder: flatbuffers.Builder, tableDef: TableDef, tableObj): flatbuffers.Offset {
        var offsets: number[] = new Array(tableDef.fieldDefs.length);

        for (var i = 0; i < tableDef.fieldDefs.length; i++) {
            var fieldDef = tableDef.fieldDefs[i];
            if (fieldDef.deprecated || !(fieldDef.name in tableObj)) {
                continue;
            }

            var value = tableObj[fieldDef.name];
            offsets[i] = 0;
            var typeDef = fieldDef.typeDef;

            switch(typeDef.baseType) {
                case reflection.BaseType.String:
                    if (value) {
                        offsets[i] = builder.createString(value);
                    }
                    break;
                case reflection.BaseType.Vector:
                    if (value && value.length) {
                        offsets[i] = this.encodeVector(builder, typeDef, value);
                    } 
                    break;
                case reflection.BaseType.Obj:
                    if (value) {
                        var nestedTableDef = this.schema.tableDefs[typeDef.index];
                        if (!nestedTableDef.isStruct) {
                            offsets[i] = this.encodeTable(builder, nestedTableDef, value);
                        }
                    }
                    break;
                default:
                    break;
            }
        }

        builder.startObject(tableDef.fieldDefs.length);

        for (var i = 0; i < tableDef.fieldDefs.length; i++) {
            var fieldDef = tableDef.fieldDefs[i];
            if (fieldDef.deprecated || !(fieldDef.name in tableObj)) {
                continue;
            }

            var value = this.exposeEnum(tableObj[fieldDef.name], fieldDef.typeDef);
            var typeDef = fieldDef.typeDef;

            switch(typeDef.baseType) {
                case reflection.BaseType.Bool:
                case reflection.BaseType.Byte:
                case reflection.BaseType.UByte:
                    builder.addFieldInt8(fieldDef.id, value, fieldDef.default);
                    break;
                case reflection.BaseType.Short:
                case reflection.BaseType.UShort:
                    builder.addFieldInt16(fieldDef.id, value, fieldDef.default);
                    break;
                case reflection.BaseType.Int:
                case reflection.BaseType.UInt:
                    builder.addFieldInt32(fieldDef.id, value, fieldDef.default);
                    break;  
                case reflection.BaseType.Float:
                    builder.addFieldFloat32(fieldDef.id, value, fieldDef.default);
                    break;
                case reflection.BaseType.Double:
                    builder.addFieldFloat64(fieldDef.id, value, fieldDef.default);
                    break;
                case reflection.BaseType.Long:
                case reflection.BaseType.ULong:
                    builder.addFieldInt64(fieldDef.id, builder.createLong(value.low, value.high), 
                        builder.createLong(fieldDef.default.low, fieldDef.default.high));
                    break;
                case reflection.BaseType.String:
                case reflection.BaseType.Vector:
                    builder.addFieldOffset(fieldDef.id, offsets[i], fieldDef.default);
                    break;
                case reflection.BaseType.Obj:
                    var nestedTableDef = this.schema.tableDefs[typeDef.index];
                    if (nestedTableDef.isStruct) {
                        var offset = this.encodeStruct(builder, nestedTableDef, value);
                        builder.addFieldStruct(fieldDef.id, offset, fieldDef.default);
                    } else {
                        builder.addFieldOffset(fieldDef.id, offsets[i], fieldDef.default);
                    }
                    break;
                case reflection.BaseType.Union:
                    throw new Error('Union type is not supported yet!');
                default:
                    break;
            }
        }

        return builder.endObject();
    };

    private encodeStruct(builder: flatbuffers.Builder, structDef: TableDef, structObj): flatbuffers.Offset {
        builder.prep(structDef.minalign, structDef.bytesize);

        for (var i = structDef.fieldDefs.length - 1; i >= 0; i--) {
            var fieldDef = structDef.fieldDefs[i];
            if (fieldDef.deprecated || !(fieldDef.name in structObj)) {
                continue;
            }

            var value = this.exposeEnum(structObj[fieldDef.name], fieldDef.typeDef);
            var typeDef = fieldDef.typeDef;

            switch(typeDef.baseType) {
                case reflection.BaseType.Bool:
                case reflection.BaseType.Byte:
                case reflection.BaseType.UByte:
                    builder.writeInt8(value);
                    break;
                case reflection.BaseType.Short:
                case reflection.BaseType.UShort:
                    builder.writeInt16(value);
                    break;
                case reflection.BaseType.Int:
                case reflection.BaseType.UInt:
                    builder.writeInt32(value);
                    break;  
                case reflection.BaseType.Float:
                    builder.writeFloat32(value);
                    break;
                case reflection.BaseType.Double:
                    builder.writeFloat64(value);
                    break;
                case reflection.BaseType.Long:
                case reflection.BaseType.ULong:
                    builder.writeInt64(builder.createLong(value.low, value.high));
                    break;
                case reflection.BaseType.Obj:
                    var nestedTableDef = this.schema.tableDefs[typeDef.index];
                    if (nestedTableDef.isStruct) {
                        this.encodeStruct(builder, nestedTableDef, value);
                    } else {
                        throw new Error('Table type is not supported in Struct!');
                    }
                    break;
                default:
                    throw new Error(typeDef.baseType + ' type is not supported in Struct yet!');
            }
        }

        return builder.offset();
    }

    private encodeVector(builder: flatbuffers.Builder, typeDef: TypeDef, vectorObj): flatbuffers.Offset {
        var offsets: number[] = new Array(vectorObj.length);
        
        for (var i = 0; i < vectorObj.length; i++) { 
            var value = vectorObj[i];
            offsets[i] = 0;

            switch(typeDef.element) {
                case reflection.BaseType.String:
                    if (value) {
                        offsets[i] = builder.createString(value);
                    }
                    break;
                case reflection.BaseType.Vector:
                    if (value && value.length) {
                        offsets[i] = this.encodeVector(builder, typeDef, value);
                    } 
                    break;
                case reflection.BaseType.Obj:
                    if (value) {
                        var nestedTableDef = this.schema.tableDefs[typeDef.index];
                        if (!nestedTableDef.isStruct) { 
                            offsets[i] = this.encodeTable(builder, nestedTableDef, value);
                        }
                    }
                    break;
                default:
                    break;
            }
        }

        builder.startVector(8, offsets.length, 4);

        for (var i = vectorObj.length - 1; i >= 0; i--) { 
            var value = this.exposeEnum(vectorObj[i], typeDef);

            switch(typeDef.element) {
                case reflection.BaseType.Bool:
                case reflection.BaseType.Byte:
                case reflection.BaseType.UByte:
                    builder.writeInt8(value);
                    break;
                case reflection.BaseType.Short:
                case reflection.BaseType.UShort:
                    builder.writeInt16(value);
                    break;
                case reflection.BaseType.Int:
                case reflection.BaseType.UInt:
                    builder.writeInt32(value);
                    break;  
                case reflection.BaseType.Float:
                    builder.writeFloat32(value);
                    break;
                case reflection.BaseType.Double:
                    builder.writeFloat64(value);
                    break;
                case reflection.BaseType.Long:
                case reflection.BaseType.ULong:
                    builder.writeInt64(builder.createLong(value.low, value.high));
                    break;
                case reflection.BaseType.String:
                case reflection.BaseType.Vector:
                    builder.addOffset(offsets[i]);
                    break;
                case reflection.BaseType.Obj:
                    var nestedTableDef = this.schema.tableDefs[typeDef.index];
                    if (nestedTableDef.isStruct) {
                        this.encodeStruct(builder, nestedTableDef, value);
                    } else {
                        builder.addOffset(offsets[i]);
                    }
                    break;
                case reflection.BaseType.Union:
                    throw new Error('Union type is not supported in Vector yet!');
                default:
                    break;
            }
        }

        return builder.endVector();
    }

    private exposeEnum(value: any, typeDef: TypeDef): any {
        // enum name to int value
        if (typeDef.index >= 0 && typeDef.baseType <= reflection.BaseType.ULong) {
            return this.schema.enumDefs[typeDef.index].byName[value].value; 
        } else {
            return value;
        }
    }

    /* =========== decode binary  =========== */

    private decodeTable(buffer: flatbuffers.ByteBuffer, position: number, tableDef: TableDef): any {
        var object = { };

        for (var i = 0; i < tableDef.fieldDefs.length; i++) {
            var fieldDef = tableDef.fieldDefs[i];
            if (fieldDef.deprecated) {
                continue;
            }

            var offset = buffer.__offset(position, fieldDef.offset);
            var typeDef = fieldDef.typeDef;
            if (!offset) {
                object[fieldDef.name] = this.coverEnum(fieldDef.default, typeDef.baseType, typeDef.index);
                continue;
            }

            var value: any;
            offset += position;

            switch(typeDef.baseType) {
                case reflection.BaseType.Bool:
                    value = !!buffer.readUint8(offset);
                    break;
                case reflection.BaseType.Byte:
                    value = buffer.readInt8(offset);
                    break;
                case reflection.BaseType.UByte:
                    value = buffer.readUint8(offset);
                    break;
                case reflection.BaseType.Short:
                    value = buffer.readInt16(offset);
                    break;
                case reflection.BaseType.UShort:
                    value = buffer.readUint16(offset);
                    break;
                case reflection.BaseType.Int:
                    value = buffer.readInt32(offset);
                    break;
                case reflection.BaseType.UInt:
                    value = buffer.readUint32(offset);
                    break;
                case reflection.BaseType.Float:
                    value = buffer.readFloat32(offset);
                    break;
                case reflection.BaseType.Double:
                    value = buffer.readFloat64(offset);
                    break;
                case reflection.BaseType.Long:
                    value = buffer.readInt64(offset);
                    break;
                case reflection.BaseType.ULong:
                    value = buffer.readUint64(offset);
                    break;
                case reflection.BaseType.String:
                    value = buffer.__string(offset);
                    break;
                case reflection.BaseType.Vector:
                    value = this.decodeVector(buffer, offset, typeDef);
                    break;
                case reflection.BaseType.Obj:
                    var nestedTableDef = this.schema.tableDefs[typeDef.index];
                    if (nestedTableDef.isStruct) {
                        value = this.decodeStruct(buffer, offset, nestedTableDef);
                    } else {
                        value = this.decodeTable(buffer, buffer.__indirect(offset), nestedTableDef);
                    }
                    break;
                case reflection.BaseType.Union:
                    throw new Error('Union type is not supported yet!');
                default:
                    break;
            }

            object[fieldDef.name] = this.coverEnum(value, typeDef.baseType, typeDef.index);
        }
        
        return object;
    }

    private decodeStruct(buffer: flatbuffers.ByteBuffer, position: number, structDef: TableDef): any {
        var object = { };

        for (var i = 0; i < structDef.fieldDefs.length; i++) {
            var fieldDef = structDef.fieldDefs[i];

            var offset = position + fieldDef.offset;
            var typeDef = fieldDef.typeDef;

            var value: any;

            switch(fieldDef.typeDef.baseType) {
                case reflection.BaseType.Bool:
                    value = !!buffer.readUint8(offset);
                    break;
                case reflection.BaseType.Byte:
                    value = buffer.readInt8(offset);
                    break;
                case reflection.BaseType.UByte:
                    value = buffer.readUint8(offset);
                    break;
                case reflection.BaseType.Short:
                    value = buffer.readInt16(offset);
                    break;
                case reflection.BaseType.UShort:
                    value = buffer.readUint16(offset);
                    break;
                case reflection.BaseType.Int:
                    value = buffer.readInt32(offset);
                    break;
                case reflection.BaseType.UInt:
                    value = buffer.readUint32(offset);
                    break;
                case reflection.BaseType.Float:
                    value = buffer.readFloat32(offset);
                    break;
                case reflection.BaseType.Double:
                    value = buffer.readFloat64(offset);
                    break;
                case reflection.BaseType.Long:
                    value = buffer.readInt64(offset);
                    break;
                case reflection.BaseType.ULong:
                    value = buffer.readUint64(offset);
                    break;
                case reflection.BaseType.Obj:
                    var nestedTableDef = this.schema.tableDefs[typeDef.index];
                    if (nestedTableDef.isStruct) {
                        value = this.decodeStruct(buffer, offset, nestedTableDef);
                    } else {
                        throw new Error('Table type is not supported in Struct!');
                    }
                    break;
                default:
                    throw new Error(typeDef.baseType + ' type is not supported in Struct yet!');
            }

            object[fieldDef.name] = this.coverEnum(value, typeDef.baseType, typeDef.index);
        }
        
        return object;
    }

    private decodeVector(buffer: flatbuffers.ByteBuffer, position: number, typeDef: TypeDef): any {
        var values = [];

        var length = buffer.__vector_len(position);
        var offset = buffer.__vector(position);

        for (var i = 0; i < length; i++) { 
            var value: any;

            switch(typeDef.element) {
                case reflection.BaseType.Bool:
                    value = !!buffer.readUint8(offset);
                    break;
                case reflection.BaseType.Byte:
                    value = buffer.readInt8(offset);
                    break;
                case reflection.BaseType.UByte:
                    value = buffer.readUint8(offset);
                    break;
                case reflection.BaseType.Short:
                    value = buffer.readInt16(offset);
                    break;
                case reflection.BaseType.UShort:
                    value = buffer.readUint16(offset);
                    break;
                case reflection.BaseType.Int:
                    value = buffer.readInt32(offset);
                    break;
                case reflection.BaseType.UInt:
                    value = buffer.readUint32(offset);
                    break;
                case reflection.BaseType.Float:
                    value = buffer.readFloat32(offset);
                    break;
                case reflection.BaseType.Double:
                    value = buffer.readFloat64(offset);
                    break;
                case reflection.BaseType.Long:
                    value = buffer.readInt64(offset);
                    break;
                case reflection.BaseType.ULong:
                    value = buffer.readUint64(offset);
                    break;
                case reflection.BaseType.String:
                    value = buffer.__string(offset);
                    break;
                case reflection.BaseType.Vector:
                    value = this.decodeVector(buffer, offset, typeDef); // TODO not support nested Vector
                    break;
                case reflection.BaseType.Obj:
                    var nestedTableDef = this.schema.tableDefs[typeDef.index];
                    if (nestedTableDef.isStruct) {
                        value = this.decodeStruct(buffer, offset, nestedTableDef);
                    } else {
                        value = this.decodeTable(buffer, buffer.__indirect(offset), nestedTableDef);
                    }
                    break;
                case reflection.BaseType.Union:
                    throw new Error('Union type is not supported yet!');
                default:
                    break;
            }

            values.push(this.coverEnum(value, typeDef.element, typeDef.index));
            offset += 4;
        }

        return values;
    }

    coverEnum(value: any, valueType: reflection.BaseType, typeIndex: number): any {
        // enum int value to name
        if (typeIndex >= 0 && valueType <= reflection.BaseType.ULong) {
            return this.schema.enumDefs[typeIndex].byValue[value].name; 
        } else {
            return value;
        }
    }

};

interface Schema {

    fileIndentifier: string;

    fileExtension: string;

    rootTable: TableDef;

    tableDefs: TableDef[];

    enumDefs: EnumDef[];

}

interface TableDef {

    name: string;           // :string|Uint8Array|null

    isStruct: boolean;

    minalign: number;

    bytesize: number;

    fieldDefs: FieldDef[];  // :reflection.Field|null

}

interface FieldDef {

    name: string;           // :string|Uint8Array|null

    typeDef: TypeDef;      

    id: number;

    offset: number;

    deprecated: boolean;

    required: boolean;

    key: boolean;

    default: any;           // :flatbuffers.Long|number|null

}

interface TypeDef {

    baseType: reflection.BaseType;

    element: reflection.BaseType;

    index: number;

}

interface EnumDef {

    name: string;           // :string|Uint8Array|null

    isUnion: boolean;

    underlyingType: TypeDef; 

    byValue: ValueDef[];

    byName: ValueDef[];

}

interface ValueDef {

    name: string;           // :string|Uint8Array|null

    value: number;

    tableDef: TableDef;

}
