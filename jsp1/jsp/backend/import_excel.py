import sqlite3
import pandas as pd

EXCEL_FILE = r"C:\Users\Admin\Downloads\Production Data Export (13 to 19 -6) (6).xlsx"
DB_FILE = "jspl_hsm.db"

df = pd.read_excel(EXCEL_FILE, header=1)

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

df["production_date"] = pd.to_datetime(df["production_date"], errors="coerce").dt.strftime("%Y-%m-%d")
df["shift"] = df.index.map(lambda i: "A" if i % 3 == 0 else ("B" if i % 3 == 1 else "C"))
df["status"] = df["yield_percent"].apply(lambda x: "FAIL" if pd.notna(x) and x < 96 else "PASS")
df["defect_type"] = df["status"].apply(lambda x: "Low Yield" if x == "FAIL" else "")

df["weight"] = pd.to_numeric(df["weight"], errors="coerce") / 1000

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

conn = sqlite3.connect(DB_FILE)

df.to_sql(
    "production_data",
    conn,
    if_exists="replace",
    index=False
)

conn.close()

print("Excel data imported successfully into jspl_hsm.db")
print("Rows imported:", len(df))