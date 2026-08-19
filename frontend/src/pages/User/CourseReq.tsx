// src/pages/User/CourseReq.tsx
import { useState, useEffect, ChangeEvent, FormEvent, Fragment } from "react";
import { DateObject } from "react-multi-date-picker";

import Button from "../../components/Button";
import Input from "../../components/Input";
import SessionSelector from "../../components/SessionSelector";
import PersianDateField from "../../components/PersianDateField";

import useSession from "../../hooks/useSession";
import { coreApi, isAxiosErrorWithMessage } from "../../lib/api";

/* ثابت‌ها */
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
type DateKey = "start_time" | "end_time" | "start_sign_up" | "end_sign_up";

/* مقایسه‌ی نسبی دو تاریخ (DateObject.toDate() همیشه معادل میلادیِ درست را برمی‌گرداند، صرف‌نظر از تقویمی که برای نمایش استفاده شده) */
const cmp = (a: DateObject | null, b: DateObject | null) => {
  if (!a || !b) return 0;
  return a.toDate().getTime() - b.toDate().getTime();
};

/* تبدیل DateObject به رشته‌ی میلادیِ YYYY-MM-DD برای ارسال به بک‌اند */
const pack = (d: DateObject) => {
  const nd = d.toDate();
  return `${nd.getFullYear()}-${String(nd.getMonth() + 1).padStart(2, "0")}-${String(
    nd.getDate()
  ).padStart(2, "0")}`;
};

function CourseReq() {
  // با تغییر این کلید، کل RequestForm (و همه‌ی state/ورودی‌های کنترل‌نشده‌ی داخلش) از نو ساخته می‌شود
  const [formKey, setFormKey] = useState(0);
  const [toast, setToast] = useState<{ ok: boolean; msg: string } | null>(null);

  const showToast = (ok: boolean, msg: string) => {
    setToast({ ok, msg });
    setTimeout(() => setToast(null), 2000);
  };

  return (
    <>
      <RequestForm
        key={formKey}
        showToast={showToast}
        onSubmitted={() => setFormKey((k) => k + 1)}
      />
      {/* Toast */}
      {toast && (
        <div
          className={`fixed left-1/2 -translate-x-1/2 top-24 px-6 py-3 rounded-xl text-white ${
            toast.ok ? "bg-green-600" : "bg-red-600"
          }`}
        >
          {toast.msg}
        </div>
      )}
    </>
  );
}

interface RequestFormProps {
  showToast: (ok: boolean, msg: string) => void;
  onSubmitted: () => void;
}

function RequestForm({ showToast, onSubmitted }: RequestFormProps) {
  const [info, setInfo] = useState<CoreInfo>({
    image: "",
    name: "",
    description: "",
    price: 0,
    field1: "",
    field2: "",
    message_text: "",
  });
  const [dates, setDates] = useState<Record<DateKey, DateObject | null>>({
    start_time: null,
    end_time: null,
    start_sign_up: null,
    end_sign_up: null,
  });
  const [imgURL, setImgURL] = useState<string | null>(null);
  const [count, setCount] = useState(3);
  const [submitting, setSubmitting] = useState(false);
  const sess = [
    useSession(),
    useSession(),
    useSession(),
    useSession(),
    useSession(),
  ] as const;

  // آزادسازی URL موقت پیش‌نمایش عکس؛ هر بار عکس عوض شود یا کامپوننت از بین برود
  useEffect(() => {
    if (!imgURL) return;
    return () => URL.revokeObjectURL(imgURL);
  }, [imgURL]);

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
  const upDate = (k: DateKey) => (v: DateObject | null) => {
    setDates((d) => ({ ...d, [k]: v }));
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();

    if (!info.image) return showToast(false, "انتخاب عکس کاور الزامی است");
    if (!info.name.trim()) return showToast(false, "نام دوره را وارد کنید");
    if (!info.field1) return showToast(false, "فیلد اول را انتخاب کنید");
    if (!info.price || info.price <= 0)
      return showToast(false, "قیمت معتبر وارد کنید");

    const st = dates.start_time,
      et = dates.end_time,
      ss = dates.start_sign_up,
      es = dates.end_sign_up;
    if (!st || !et || !ss || !es)
      return showToast(false, "لطفاً همه‌ی تاریخ‌ها را انتخاب کنید");
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

    /* جمع‌آوری جلسات با day */
    const parseMin = (t: string) => {
      const [h, m] = t.split(":").map(Number);
      return h * 60 + m;
    };

    let times: { day: string; start_time: number; end_time: number }[];
    try {
      times = sess.slice(0, count).map(([s], index) => {
        if (!s.day) {
          showToast(false, `روز جلسه ${index + 1} انتخاب نشده`);
          throw new Error();
        }
        if (!s.start_time || !s.end_time) {
          showToast(false, `ساعت شروع و پایان جلسه ${index + 1} را مشخص کنید`);
          throw new Error();
        }
        const stMin = parseMin(s.start_time),
          enMin = parseMin(s.end_time);
        if (stMin >= enMin) {
          showToast(false, `جلسه ${index + 1}: شروع باید قبل از پایان باشد`);
          throw new Error();
        }
        return { day: s.day, start_time: stMin, end_time: enMin };
      });
    } catch {
      return;
    }

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

    try {
      setSubmitting(true);
      await coreApi.post("/courses", fd);
      showToast(true, "✅ با موفقیت ثبت شد");
      onSubmitted();
    } catch (err) {
      const message =
        isAxiosErrorWithMessage(err) && err.response?.data?.message
          ? err.response.data.message
          : "خطا در ثبت دوره";
      showToast(false, message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
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
                <Input
                  type="file"
                  name="image"
                  label="عکس کاور"
                  accept="image/*"
                  onChange={upInfo("image")}
                  inpClass="w-full border-2 border-dashed rounded-lg p-3"
                  required
                />
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
              <Input
                type="text"
                name="name"
                label="نام دوره"
                value={info.name}
                onChange={upInfo("name")}
                inpClass="w-full border rounded-lg p-3"
                required
              />

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
                      required={idx === 0}
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
                    ["start_time", "شروع دوره"],
                    ["end_time", "پایان دوره"],
                    ["start_sign_up", "شروع ثبت‌نام"],
                    ["end_sign_up", "پایان ثبت‌نام"],
                  ] as [DateKey, string][]
                ).map(([key, label]) => (
                  <PersianDateField
                    key={key}
                    label={label}
                    value={dates[key]}
                    onChange={upDate(key)}
                  />
                ))}
              </div>

              {/* قیمت */}
              <Input
                type="number"
                name="price"
                label="قیمت (تومان)"
                value={info.price === 0 ? "" : info.price}
                onChange={upInfo("price")}
                inpClass="w-full border rounded-lg p-3"
                min={0}
                required
              />

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
                {(["description", "message_text"] as const).map(
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
                  butClass="bg-green-600 hover:bg-green-700 text-white px-8 py-3 rounded-lg disabled:opacity-50"
                  disabled={submitting}
                  divClass=""
                >
                  {submitting ? "در حال ثبت..." : "ثبت اطلاعات دوره"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      </section>
    </section>
  );
}

export default CourseReq;
