import { ChangeEvent } from "react";
import SelectOptions from "../../../components/ui/SelectOptions";
import Input from "../../../components/ui/Input";
import type { SessionField } from "../../../hooks/useSession";

interface SessionSelectorProps {
  days: string[];
  /** حالا ترکیبی از ChangeEvent<HTMLInputElement> و ChangeEvent<HTMLSelectElement> */
  setSession: (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
  label: string;
  description: string;
  disabled: boolean;
}

function SessionSelector({ days, setSession, label, description, disabled }: SessionSelectorProps){
  return(
    <section className="w-full">
      <p className="mb-2 font-medium">{label}</p>
      <div className="flex gap-2">
        <SelectOptions
          name={"day" satisfies SessionField}
          label="انتخاب روز"
          options={days}
          description="لطفا روز جلسه را انتخاب کنید"
          divClass="w-[50%]"
          selClass="w-full my-3 py-3 bg-[#F7F2EF] rounded-2xl px-5"
          onChange={(e) => setSession(e)}
        />
  
        <Input
          divClass="w-[25%]"
          inpClass="w-full my-3 py-3 bg-[#F7F2EF] rounded-2xl px-5"
          type="time"
          name={"start_time" satisfies SessionField}
          label="زمان شروع"
          placeholder=""
          description=""
          onChange={(e) => setSession(e)}
          disabled={disabled}
        />
  
        <p className="py-3">تا</p>
    
        <Input
          divClass="w-[25%]"
          inpClass="w-full my-3 py-3 bg-[#F7F2EF] rounded-2xl px-5"
          type="time"
          name={"end_time" satisfies SessionField}
          label="زمان پایان"
          placeholder=""
          description=""
          onChange={(e) => setSession(e)}
          disabled={disabled}
        />
      </div>
      <p className="mt-1 text-sm text-gray-600">{description}</p>
    </section>

  )
}
  

export default SessionSelector;
