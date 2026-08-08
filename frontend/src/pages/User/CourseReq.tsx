// src/pages/User/CourseReq.tsx
import { useEffect, useState, ChangeEvent, FormEvent, Fragment } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

import Button from "../../components/Button";
import SessionSelector from "../../components/SessionSelector";

import useWindowSize from "../../hooks/useWindowSize";
import useSession, { Session } from "../../hooks/useSession";

/* ثابت‌ها */
const years = Array.from({ length: 101 }, (_, i) => (1400 + i).toString());
const months = Array.from({ length: 12 }, (_, i) => (i + 1).toString());
const days31 = Array.from({ length: 31 }, (_, i) => (i + 1).toString());
const categories = [
  "عمومی",
  "علوم پایه",
  "برق و کامپیوتر",
  "مکانیک",
  "عمران و معماری",
  "صنایع و مدیریت",
];

/* انواع */
interface CoreInfo {
  image: File | "";
  description: string;
  price: number;
  field1: string;
  field2: string;
  name: string;
  message_text: string;
}
type YMD = { y: string; m: string; d: string };
type DateKey = "start_time" | "end_time" | "start_sign_up" | "end_sign_up";

/* تبدیل YMD به JS Date */
const toDate = ({ y, m, d }: YMD) =>
  y && m && d ? new Date(+y, +m - 1, +d) : null;
/* مقایسه */
const cmp = (a: YMD, b: YMD) => {
  const da = toDate(a),
    db = toDate(b);
  return da && db ? da.getTime() - db.getTime() : 0;
};

const CourseReq: React.FC = () => {
  const { width } = useWindowSize();
  const nav = useNavigate();
  useEffect(() => {
    if (localStorage.getItem("isUserLogin") === "") nav("../login");
  }, [nav]);
  return (
    <section className="grid grid-cols-12 px-6 pb-10">
      <section
        className={width >= 1024 ? "col-span-9 col-start-4" : "col-span-12"}
      >
        <div className="max-w-5xl mx-auto mt-8 bg-white rounded-2xl shadow-xl p-8 md:p-12">
          <RequestForm />
        </div>
      </section>
    </section>
  );
};

const RequestForm: React.FC = () => {
  const [info, setInfo] = useState<CoreInfo>({
    image: "",
    name: "",
    description: "",
    price: 0,
    field1: "",
    field2: "",
    message_text: "",
  });
  const [dates, setDates] = useState<Record<DateKey, YMD>>({
    start_time: { y: "", m: "", d: "" },
    end_time: { y: "", m: "", d: "" },
    start_sign_up: { y: "", m: "", d: "" },
    end_sign_up: { y: "", m: "", d: "" },
  });
  const [imgURL, setImgURL] = useState<string | null>(null);
  const [count, setCount] = useState(3);
  const sess = [
    useSession(),
    useSession(),
    useSession(),
    useSession(),
    useSession(),
  ] as const;
  const [toast, setToast] = useState<{ ok: boolean; msg: string } | null>(null);
  const showToast = (ok: boolean, msg: string) => {
    setToast({ ok, msg });
    setTimeout(() => setToast(null), 2000);
  };
  /* core تغییرات */
  const upInfo =
    (k: keyof CoreInfo) =>
      (
        e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
      ) => {
        if (k === "price")
          return setInfo((p) => ({ ...p, price: +e.target.value }));
        if (k === "image") {
          const f = (e.target as HTMLInputElement).files?.[0];
          if (!f) return;
          if (!f.type.startsWith("image/"))
            return showToast(false, "فایل تصویر نیست");
          setImgURL(URL.createObjectURL(f));
          return setInfo((p) => ({ ...p, image: f }));
        }
        setInfo((p) => ({ ...p, [k]: e.target.value }));
      };
  /* date تغییرات */
  const upDate =
    (k: DateKey, p: keyof YMD) => (e: ChangeEvent<HTMLSelectElement>) => {
      setDates((d) => ({ ...d, [k]: { ...d[k], [p]: e.target.value } }));
    };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const st = dates.start_time,
      et = dates.end_time,
      ss = dates.start_sign_up,
      es = dates.end_sign_up;
    if (cmp(st, et) >= 0)
      return showToast(false, "پایان دوره باید بعد از شروع باشد");
    if (cmp(ss, es) >= 0)
      return showToast(false, "پایان ثبت‌نام بعد از شروع باشد");
    if (cmp(ss, st) >= 0)
      return showToast(false, "شروع ثبت‌نام باید قبل از شروع دوره باشد");
    if (cmp(es, et) >= 0 || cmp(ss, et) >= 0)
      return showToast(false, "ثبت‌نام قبل از پایان دوره باشد");
    if (info.field2 && info.field1 === info.field2)
      return showToast(false, "فیلد اول و دوم نباید تکراری باشد");

    const pack = (d: YMD) =>
      `${d.y}-${d.m.padStart(2, "0")}-${d.d.padStart(2, "0")}`;

    /* جمع‌آوری جلسات با day */
    const parseMin = (t: string) => {
      const [h, m] = t.split(":").map(Number);
      return h * 60 + m;
    };
    const times = sess.slice(0, count).map(([s], index) => {
      if (!s.day) {
        showToast(false, `روز جلسه ${index + 1} انتخاب نشده`);
        throw new Error();
      }
      const stMin = parseMin(s.start_time!),
        enMin = parseMin(s.end_time!);
      if (stMin >= enMin) {
        showToast(
          false,
          `جلسه ${index + 1}: شروع باید قبل از پایان باشد`
        );
        throw new Error();
      }
      return {
        day: s.day,
        start_time: stMin,
        end_time: enMin,
      };
    });

    const fd = new FormData();
    fd.append("name", info.name);
    fd.append("description", info.description);
    fd.append("price", info.price.toString());
    fd.append("field1", info.field1);
    if (info.field2) fd.append("field2", info.field2);
    fd.append("message_text", info.message_text);
    fd.append("start_time", pack(st));
    fd.append("end_time", pack(et));
    fd.append("start_sign_up", pack(ss));
    fd.append("end_sign_up", pack(es));
    fd.append("times", JSON.stringify(times));
    if (info.image) fd.append("image", info.image);

    const token = localStorage.getItem("token");
    if (!token) return showToast(false, "ابتدا وارد شوید");

    try {
      await axios.post("http://localhost:5000/courses", fd, {
        headers: {
          "Content-Type": "multipart/form-data",
          Authorization: `Bearer ${token}`,
        },
      });
      showToast(true, "✅ با موفقیت ثبت شد");
    } catch (err: any) {
      showToast(false, err?.response?.data?.message || "خطا");
    }
  };

  return (
    <>
      <section className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 px-4 sm:px-6 lg:px-8 w-full">
        <section className="w-full max-w-7xl mx-auto py-6 lg:py-8">
          <div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-8">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                  <svg
                    className="w-5 h-5 ml-3"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <div>
                  <h1 className="text-2xl lg:text-3xl font-bold text-white">
                    ثبت دوره جدید
                  </h1>
                  <p className="text-blue-100 mt-1">
                    اطلاعات دوره را وارد کنید
                  </p>
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="p-6 lg:p-8">
              <form onSubmit={submit} className="space-y-8">
                {/* تصویر */}
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label>عکس کاور</label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={upInfo("image")}
                      className="w-full border-2 border-dashed rounded-lg p-3"
                    />
                  </div>
                  {imgURL && (
                    <div className="border rounded-lg p-4 flex justify-center">
                      <img
                        src={imgURL}
                        alt=""
                        className="h-48 object-contain"
                      />
                    </div>
                  )}
                </div>

                {/* نام */}
                <div>
                  <label>نام دوره</label>
                  <input
                    type="text"
                    onChange={upInfo("name")}
                    className="w-full border rounded-lg p-3"
                  />
                </div>

                {/* فیلدها */}
                <div className="grid md:grid-cols-2 gap-6">
                  {["field1", "field2"].map((fld, idx) => (
                    <div key={fld}>
                      <label>
                        {idx === 0 ? "فیلد اول" : "فیلد دوم (اختیاری)"}
                      </label>
                      <select
                        defaultValue=""
                        onChange={upInfo(fld as keyof CoreInfo)}
                        className="w-full border rounded-lg p-3"
                      >
                        <option value="" disabled>
                          انتخاب
                        </option>
                        {categories.map((c) => (
                          <option key={c} value={c}>
                            {c}
                          </option>
                        ))}
                      </select>
                    </div>
                  ))}
                </div>

                {/* تاریخ‌ها */}
                <div className="grid md:grid-cols-2 gap-8">
                  {(
                    [
                      "start_time",
                      "end_time",
                      "start_sign_up",
                      "end_sign_up",
                    ] as DateKey[]
                  ).map((key) => (
                    <div key={key}>
                      <p className="font-medium">
                        {
                          {
                            start_time: "شروع دوره",
                            end_time: "پایان دوره",
                            start_sign_up: "شروع ثبت‌نام",
                            end_sign_up: "پایان ثبت‌نام",
                          }[key]
                        }
                      </p>
                      <div className="flex gap-2">
                        <select
                          onChange={upDate(key, "d")}
                          className="flex-1 border rounded-lg p-2"
                        >
                          <option value="">روز</option>
                          {days31
                            .filter(
                              (d) =>
                                !dates[key].m || +dates[key].m <= 6 || +d <= 30
                            )
                            .map((d) => (
                              <option key={d}>{d}</option>
                            ))}
                        </select>
                        <select
                          onChange={upDate(key, "m")}
                          className="flex-1 border rounded-lg p-2"
                        >
                          <option value="">ماه</option>
                          {months.map((m) => (
                            <option key={m}>{m}</option>
                          ))}
                        </select>
                        <select
                          onChange={upDate(key, "y")}
                          className="flex-1 border rounded-lg p-2"
                        >
                          <option value="">سال</option>
                          {years.map((y) => (
                            <option key={y}>{y}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  ))}
                </div>

                {/* قیمت */}
                <div>
                  <label>قیمت (تومان)</label>
                  <input
                    type="number"
                    onChange={upInfo("price")}
                    className="w-full border rounded-lg p-3"
                  />
                </div>

                {/* جلسات */}
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <h3>جلسات دوره</h3>
                    <span>{count} جلسه/هفته</span>
                  </div>
                  <input
                    type="range"
                    min={1}
                    max={5}
                    value={count}
                    onChange={(e) => setCount(+e.target.value)}
                    className="w-full accent-blue-600"
                  />
                  <div className="grid md:grid-cols-2 gap-6">
                    {Array.from({ length: count }).map((_, i) => (
                      <Fragment key={i}>
                        <SessionSelector
                          days={[
                            "شنبه",
                            "یک‌شنبه",
                            "دوشنبه",
                            "سه‌شنبه",
                            "چهارشنبه",
                            "پنج‌شنبه",
                            "جمعه",
                          ]}
                          label={`جلسه ${i + 1}`}
                          description=""
                          setSession={(ses) => sess[i][1](ses)}
                          disabled={false}
                        />
                      </Fragment>
                    ))}
                  </div>
                </div>

                {/* توضیحات و پیام */}
                <div className="space-y-6">
                  {(["description", "message_text"] as (keyof CoreInfo)[]).map(
                    (k) => (
                      <div key={k}>
                        <label>
                          {
                            {
                              description: "توضیحات دوره",
                              message_text: "پیام برای ادمین",
                            }[k]
                          }
                        </label>
                        <textarea
                          rows={4}
                          onChange={upInfo(k)}
                          className="w-full border rounded-lg p-3"
                        />
                      </div>
                    )
                  )}
                </div>

                {/* ارسال */}
                <div className="text-center">
                  <Button
                    type="submit"
                    handler={() => { }}
                    butClass="bg-green-600 hover:bg-green-700 text-white px-8 py-3 rounded-lg"
                    disabled={false}
                    divClass=""
                  >
                    ثبت اطلاعات دوره
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </section>
      </section>
      {/* Toast */}
      {toast && (
        <div
          className={`fixed left-1/2 -translate-x-1/2 top-24 px-6 py-3 rounded-xl text-white ${toast.ok ? "bg-green-600" : "bg-red-600"
            }`}
        >
          {toast.msg}
        </div>
      )}
    </>
  );
};

export default CourseReq;
