from flask import Flask, jsonify, request
from flask_cors import CORS
import sqlite3
import pandas as pd
import os
import pyodbc
from dotenv import load_dotenv
from datetime import datetime

load_dotenv()

app = Flask(__name__)
CORS(app)

DB = "jspl_hsm.db"


def get_sql_connection():
    return pyodbc.connect(
        f"DRIVER={{{os.getenv('DB_DRIVER')}}};"
        f"SERVER={os.getenv('DB_SERVER')};"
        f"DATABASE={os.getenv('DB_NAME')};"
        f"UID={os.getenv('DB_USER')};"
        f"PWD={os.getenv('DB_PASSWORD')};"
    )


def calculate_shift(dt):
    hour = pd.to_datetime(dt).hour
    if 6 <= hour < 14:
        return "A"
    if 14 <= hour < 22:
        return "B"
    return "C"


@app.route("/")
def home():
    return "JSPL Backend Running"


@app.route("/api/upload-excel", methods=["POST"])
def upload_excel():
    if "file" not in request.files:
        return jsonify({"error": "No file uploaded"}), 400

    file = request.files["file"]

    if file.filename == "":
        return jsonify({"error": "No selected file"}), 400

    os.makedirs("uploads", exist_ok=True)
    upload_path = os.path.join("uploads", file.filename)
    file.save(upload_path)

    df = pd.read_excel(upload_path, header=1)

    df = df.rename(columns={
        "Product Time": "production_date",
        "Coil ID": "coil_id",
        "SGC": "steel_grade_code",
        "SGF": "steel_grade_family",
        "Slab Type": "slab_type",
        "Thk Act[mm]": "thickness",
        "FM Wid Act[mm]": "width",
        "Fce": "furnace",
        "Coil Wt Act[kg]": "weight",
        "Yield[%]": "yield_percent",
        "Cust Name": "customer_name",
        "Roll Time(sec)": "delay_minutes"
    })

    df["production_date"] = pd.to_datetime(
        df["production_date"],
        errors="coerce",
        dayfirst=True
    )

    df["shift"] = df["production_date"].apply(
        lambda x: calculate_shift(x) if pd.notna(x) else ""
    )

    df["production_date"] = df["production_date"].dt.strftime("%Y-%m-%d %H:%M:%S")

    df["weight"] = pd.to_numeric(df["weight"], errors="coerce") / 1000
    df["yield_percent"] = pd.to_numeric(df["yield_percent"], errors="coerce")

    def get_excel_status(x):
        if pd.isna(x):
            return "PENDING"
        return "FAIL" if x < 96 else "PASS"

    df["status"] = df["yield_percent"].apply(get_excel_status)

    df["defect_type"] = df["status"].apply(
        lambda x: "Low Yield" if x == "FAIL" else ""
    )

    final_columns = [
        "production_date",
        "shift",
        "coil_id",
        "steel_grade_code",
        "steel_grade_family",
        "slab_type",
        "thickness",
        "width",
        "furnace",
        "weight",
        "yield_percent",
        "status",
        "defect_type",
        "customer_name",
        "delay_minutes"
    ]

    df = df[final_columns]

    conn = sqlite3.connect(DB)
    df.to_sql("production_data", conn, if_exists="replace", index=False)
    conn.close()

    return jsonify({
        "message": "Excel uploaded successfully",
        "source": "excel",
        "rows": len(df),
        "data": df.fillna("").to_dict(orient="records")
    })


@app.route("/api/production")
def production():
    conn = sqlite3.connect(DB)
    df = pd.read_sql_query("SELECT * FROM production_data", conn)
    conn.close()

    return jsonify(df.fillna("").to_dict(orient="records"))


@app.route("/api/database-production")
def database_production():
    conn = None

    try:
        start_date = request.args.get("startDate")
        end_date = request.args.get("endDate")
        start_time = request.args.get("startTime")
        end_time = request.args.get("endTime")

        grade = request.args.get("grade")
        sgf = request.args.get("sgf")
        customer = request.args.get("customer")
        shift = request.args.get("shift")
        limit = request.args.get("limit")

        if limit:
            try:
                limit = int(limit)
            except ValueError:
                limit = None
        else:
            limit = None

        conn = get_sql_connection()
        top_clause = f"TOP {limit}" if limit else ""

        query = f"""
        SELECT {top_clause}
            p.gt_HistoryKeyTm AS production_date,
            p.c_CoilID AS coil_id,

            LTRIM(RTRIM(p.c_GrdCode)) AS steel_grade_code,
            LTRIM(RTRIM(p.c_GrdCode)) AS steel_grade_family,

            CASE
                WHEN p.i_SlabType = 1 THEN 'CCR'
                WHEN p.i_SlabType = 2 THEN 'WCR'
                WHEN p.i_SlabType = 3 THEN 'HCR'
                ELSE CONCAT('Slab Type ', p.i_SlabType)
            END AS slab_type,

            p.f_SlabThkCold AS thickness,
            p.f_SlabWidCold AS width,
            p.i_FceNo AS furnace,

            p.f_SlabWt AS slab_weight,
            t.f_CoilActWt AS coil_actual_weight,

            CASE
                WHEN p.f_SlabWt IS NOT NULL
                     AND p.f_SlabWt > 0
                     AND t.f_CoilActWt IS NOT NULL
                     AND t.f_CoilActWt > 0
                THEN (t.f_CoilActWt / p.f_SlabWt) * 100
                ELSE NULL
            END AS yield_percent,

            LTRIM(RTRIM(p.c_CustName)) AS customer_name,
            LTRIM(RTRIM(p.c_ProductTypeCode)) AS product_type,

            q.f_FMDelThkPcntOnTol AS thickness_quality,
            q.f_FMDelWidPcntOnTol AS width_quality,
            q.f_FMDelTempPcntOnTol AS temperature_quality,
            q.f_CTPcntOnTol AS ct_quality,
            q.f_FlatSymPcntOnTol AS flatness_quality,
            q.f_ProfPcntOnTol AS profile_quality,
            q.f_WdgPcntOnTol AS wedge_quality,

            q.i_FMDelThkQualCode AS thickness_quality_code,
            q.i_FMDelWidQualCode AS width_quality_code,
            q.i_FMDelTempQualCode AS temperature_quality_code,
            q.i_CTQualCode AS ct_quality_code,
            q.i_FlatSymQualCode AS flatness_quality_code,
            q.i_ProfQualCode AS profile_quality_code,
            q.i_WdgQualCode AS wedge_quality_code

        FROM dbo.r_PDI p

        LEFT JOIN dbo.r_ClassifyResult q
            ON p.c_CoilID = q.c_CoilID

        LEFT JOIN dbo.r_TrkAct t
            ON p.c_CoilID = t.c_CoilID

        WHERE p.gt_HistoryKeyTm IS NOT NULL
        """

        params = []

        if start_date and end_date:
            start_datetime = f"{start_date} {start_time if start_time else '00:00:00'}"
            end_datetime = f"{end_date} {end_time if end_time else '23:59:59'}"

            query += """
            AND p.gt_HistoryKeyTm >= ?
            AND p.gt_HistoryKeyTm <= ?
            """
            params.extend([start_datetime, end_datetime])

        else:
            query += """
            AND p.gt_HistoryKeyTm >= DATEADD(
                HOUR,
                22,
                CAST(EOMONTH(GETDATE(), -1) AS DATETIME)
            )
            AND p.gt_HistoryKeyTm <= GETDATE()
            """

        if grade and grade != "All":
            query += """
            AND LTRIM(RTRIM(p.c_GrdCode)) = ?
            """
            params.append(grade.strip())

        if sgf and sgf != "All":
            query += """
            AND LTRIM(RTRIM(p.c_GrdCode)) = ?
            """
            params.append(sgf.strip())

        if customer and customer != "All":
            query += """
            AND LTRIM(RTRIM(p.c_CustName)) = ?
            """
            params.append(customer.strip())

        query += """
        ORDER BY p.gt_HistoryKeyTm DESC
        """

        df = pd.read_sql(query, conn, params=params)

        df["production_date"] = pd.to_datetime(df["production_date"], errors="coerce")

        df["shift"] = df["production_date"].apply(
            lambda x: calculate_shift(x) if pd.notna(x) else ""
        )

        if shift and shift != "All Shifts":
            df = df[df["shift"] == shift]

        df["production_date"] = df["production_date"].dt.strftime("%Y-%m-%d %H:%M:%S")

        df["slab_weight"] = pd.to_numeric(df["slab_weight"], errors="coerce")
        df["coil_actual_weight"] = pd.to_numeric(df["coil_actual_weight"], errors="coerce")
        df["yield_percent"] = pd.to_numeric(df["yield_percent"], errors="coerce")

        df["weight"] = df["coil_actual_weight"].apply(
            lambda x: x / 1000 if pd.notna(x) and x > 0 else 0
        )

        df["furnace"] = df["furnace"].apply(
            lambda x: f"Furnace {int(x)}" if pd.notna(x) else ""
        )

        quality_cols = [
            "thickness_quality",
            "width_quality",
            "temperature_quality",
            "ct_quality",
            "flatness_quality",
            "profile_quality",
            "wedge_quality"
        ]

        for col in quality_cols:
            df[col] = pd.to_numeric(df[col], errors="coerce")

        def get_status(x):
            if pd.isna(x):
                return "PENDING"
            return "FAIL" if x < 95 else "PASS"

        df["status"] = df["yield_percent"].apply(get_status)

        def get_defect_type(row):
            if row["status"] == "PENDING":
                return "Pending Coil Weight"

            if row["status"] == "FAIL":
                if row.get("thickness_quality_code") not in [1, "1", None, ""]:
                    return "Thickness"
                if row.get("width_quality_code") not in [1, "1", None, ""]:
                    return "Width"
                if row.get("temperature_quality_code") not in [1, "1", None, ""]:
                    return "Temperature"
                if row.get("ct_quality_code") not in [1, "1", None, ""]:
                    return "CT"
                if row.get("flatness_quality_code") not in [1, "1", None, ""]:
                    return "Flatness"
                if row.get("profile_quality_code") not in [1, "1", None, ""]:
                    return "Profile"
                if row.get("wedge_quality_code") not in [1, "1", None, ""]:
                    return "Wedge"
                return "Low Yield"

            return ""

        df["defect_type"] = df.apply(get_defect_type, axis=1)

        final_columns = [
            "production_date",
            "shift",
            "coil_id",
            "steel_grade_code",
            "steel_grade_family",
            "slab_type",
            "thickness",
            "width",
            "furnace",
            "weight",
            "slab_weight",
            "coil_actual_weight",
            "yield_percent",
            "status",
            "defect_type",
            "customer_name",
            "product_type",
            "thickness_quality",
            "width_quality",
            "temperature_quality",
            "ct_quality",
            "flatness_quality",
            "profile_quality",
            "wedge_quality"
        ]

        df = df[final_columns]

        return jsonify({
            "source": "database",
            "rows": len(df),
            "data": df.fillna("").to_dict(orient="records"),
            "last_updated": datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        })

    except Exception as e:
        return jsonify({
            "source": "database",
            "error": str(e),
            "data": []
        }), 500

    finally:
        if conn:
            conn.close()


if __name__ == "__main__":
    app.run(
        host="0.0.0.0",
        port=int(os.environ.get("PORT", 5000))
    )
