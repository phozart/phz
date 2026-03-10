use arrow::array::{
    ArrayRef, BooleanBuilder, Date32Builder, Float64Builder, Int32Builder, Int64Builder,
    StringBuilder,
};
use arrow::datatypes::{DataType, Field, Schema};
use arrow::ipc::writer::StreamWriter;
use arrow::record_batch::RecordBatch;
use chrono::NaiveDate;
use std::sync::Arc;
use tokio_postgres::types::Type;
use tokio_postgres::Row;

use crate::error::AppError;

/// Convert a PG column type to an Arrow DataType.
fn pg_type_to_arrow(pg_type: &Type) -> DataType {
    match *pg_type {
        Type::INT2 | Type::INT4 => DataType::Int32,
        Type::INT8 | Type::OID => DataType::Int64,
        Type::FLOAT4 | Type::FLOAT8 | Type::NUMERIC => DataType::Float64,
        Type::BOOL => DataType::Boolean,
        Type::DATE => DataType::Date32,
        _ => DataType::Utf8, // VARCHAR, TEXT, etc.
    }
}

/// Build an Arrow Schema from PG column metadata.
pub fn schema_from_columns(columns: &[tokio_postgres::Column]) -> Schema {
    let fields: Vec<Field> = columns
        .iter()
        .map(|c| Field::new(c.name(), pg_type_to_arrow(c.type_()), true))
        .collect();
    Schema::new(fields)
}

/// Epoch for Date32: 1970-01-01
const EPOCH: NaiveDate = NaiveDate::MIN;

/// Convert PG rows to an Arrow RecordBatch.
pub fn rows_to_record_batch(
    rows: &[Row],
    schema: &Schema,
    columns: &[tokio_postgres::Column],
) -> Result<RecordBatch, AppError> {
    let mut arrays: Vec<ArrayRef> = Vec::with_capacity(schema.fields().len());

    for (i, field) in schema.fields().iter().enumerate() {
        let pg_type = columns[i].type_();
        let arr: ArrayRef = match field.data_type() {
            DataType::Int32 => {
                let mut builder = Int32Builder::with_capacity(rows.len());
                for row in rows {
                    match *pg_type {
                        Type::INT2 => {
                            let v: Option<i16> = row.get(i);
                            builder.append_option(v.map(|x| x as i32));
                        }
                        _ => {
                            let v: Option<i32> = row.get(i);
                            builder.append_option(v);
                        }
                    }
                }
                Arc::new(builder.finish())
            }
            DataType::Int64 => {
                let mut builder = Int64Builder::with_capacity(rows.len());
                for row in rows {
                    let v: Option<i64> = row.get(i);
                    builder.append_option(v);
                }
                Arc::new(builder.finish())
            }
            DataType::Float64 => {
                let mut builder = Float64Builder::with_capacity(rows.len());
                for row in rows {
                    // NUMERIC comes as rust_decimal or string — try f64 first
                    match *pg_type {
                        Type::NUMERIC => {
                            // tokio-postgres decodes NUMERIC as &str via Display
                            let raw: Option<String> =
                                row.try_get::<_, String>(i).ok();
                            let v = raw.and_then(|s| s.parse::<f64>().ok());
                            builder.append_option(v);
                        }
                        _ => {
                            let v: Option<f64> = row.get(i);
                            builder.append_option(v);
                        }
                    }
                }
                Arc::new(builder.finish())
            }
            DataType::Boolean => {
                let mut builder = BooleanBuilder::with_capacity(rows.len());
                for row in rows {
                    let v: Option<bool> = row.get(i);
                    builder.append_option(v);
                }
                Arc::new(builder.finish())
            }
            DataType::Date32 => {
                let mut builder = Date32Builder::with_capacity(rows.len());
                for row in rows {
                    let v: Option<NaiveDate> = row.get(i);
                    builder.append_option(v.map(|d| {
                        d.signed_duration_since(EPOCH).num_days() as i32
                    }));
                }
                Arc::new(builder.finish())
            }
            _ => {
                // Utf8 fallback — get as String
                let mut builder = StringBuilder::with_capacity(rows.len(), rows.len() * 32);
                for row in rows {
                    let v: Option<String> = row.try_get::<_, String>(i).ok();
                    builder.append_option(v.as_deref());
                }
                Arc::new(builder.finish())
            }
        };
        arrays.push(arr);
    }

    let batch = RecordBatch::try_new(Arc::new(schema.clone()), arrays)?;
    Ok(batch)
}

/// Serialize a RecordBatch to Arrow IPC stream format bytes.
/// Stream format is required for DuckDB WASM's insertArrowFromIPCStream.
pub fn batch_to_ipc_bytes(batch: &RecordBatch) -> Result<Vec<u8>, AppError> {
    let mut buf = Vec::new();
    {
        let mut writer = StreamWriter::try_new(&mut buf, &batch.schema())?;
        writer.write(batch)?;
        writer.finish()?;
    }
    Ok(buf)
}

/// Serialize multiple RecordBatches to Arrow IPC stream format bytes.
pub fn batches_to_ipc_bytes(
    batches: &[RecordBatch],
    schema: &Arc<Schema>,
) -> Result<Vec<u8>, AppError> {
    let mut buf = Vec::new();
    {
        let mut writer = StreamWriter::try_new(&mut buf, schema)?;
        for batch in batches {
            writer.write(batch)?;
        }
        writer.finish()?;
    }
    Ok(buf)
}
