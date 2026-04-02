"use client";
import { ChevronRight } from "lucide-react";
import { Button } from "../ui/Button";
import { Menu } from "../ui/Menu";

export default function QuickActionsBar({
  onAddFile,
  onAddAdvance,
  onAddExpense,
  onMore,
  secondaryActionLabel = "Add advance",
}: {
  onAddFile: () => void;
  onAddAdvance: () => void;
  onAddExpense: () => void;
  onMore?: (key: string) => void;
  secondaryActionLabel?: string;
}) {
  return (
    <div className="flex items-center mt-2  flex-row gap-3">
      <Button
        variant="primary"
        className="py-3 w-full whitespace-nowrap"
        onClick={onAddFile}
      >
        <svg
          width="16"
          height="20"
          viewBox="0 0 16 20"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M9.586 0C10.0556 0.000114731 10.5101 0.165434 10.87 0.467L11 0.586L15.414 5C15.746 5.33202 15.9506 5.77028 15.992 6.238L16 6.414V18C16.0002 18.5046 15.8096 18.9906 15.4665 19.3605C15.1234 19.7305 14.6532 19.9572 14.15 19.995L14 20H2C1.49542 20.0002 1.00943 19.8096 0.639452 19.4665C0.269471 19.1234 0.0428434 18.6532 0.00500021 18.15L1.00268e-07 18V2C-0.000159579 1.49542 0.190406 1.00943 0.533497 0.639452C0.876588 0.269471 1.34684 0.0428433 1.85 0.00500011L2 0H9.586ZM8 2H2V18H14V8H9.5C9.10218 8 8.72064 7.84196 8.43934 7.56066C8.15804 7.27936 8 6.89782 8 6.5V2ZM8 9.5C8.26522 9.5 8.51957 9.60536 8.70711 9.79289C8.89464 9.98043 9 10.2348 9 10.5V12H10.5C10.7652 12 11.0196 12.1054 11.2071 12.2929C11.3946 12.4804 11.5 12.7348 11.5 13C11.5 13.2652 11.3946 13.5196 11.2071 13.7071C11.0196 13.8946 10.7652 14 10.5 14H9V15.5C9 15.7652 8.89464 16.0196 8.70711 16.2071C8.51957 16.3946 8.26522 16.5 8 16.5C7.73478 16.5 7.48043 16.3946 7.29289 16.2071C7.10536 16.0196 7 15.7652 7 15.5V14H5.5C5.23478 14 4.98043 13.8946 4.79289 13.7071C4.60536 13.5196 4.5 13.2652 4.5 13C4.5 12.7348 4.60536 12.4804 4.79289 12.2929C4.98043 12.1054 5.23478 12 5.5 12H7V10.5C7 10.2348 7.10536 9.98043 7.29289 9.79289C7.48043 9.60536 7.73478 9.5 8 9.5ZM10 2.414V6H13.586L10 2.414Z"
            fill="white"
          />
        </svg>
        Add new royalty record
      </Button>
      <Button
        className="bg-[#00D447] px-10 py-3 w-full inline-flex whitespace-nowrap hover:bg-emerald-700 text-white"
        onClick={onAddAdvance}
      >
        <svg
          width="20"
          height="17"
          viewBox="0 0 20 17"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            fill-rule="evenodd"
            clip-rule="evenodd"
            d="M0 3.48718C0 1.56126 1.62806 0 3.63636 0H16.3636C18.3719 0 20 1.56126 20 3.48718V10.2436C20 10.7251 19.593 11.1154 19.0909 11.1154C18.5888 11.1154 18.1818 10.7251 18.1818 10.2436V5.66667H1.81818V13.0769C1.81818 14.0399 2.63221 14.8205 3.63636 14.8205H12.2727C12.7748 14.8205 13.1818 15.2108 13.1818 15.6923C13.1818 16.1738 12.7748 16.5641 12.2727 16.5641H3.63636C1.62806 16.5641 0 15.0028 0 13.0769V3.48718ZM1.81818 3.92308H18.1818V3.48718C18.1818 2.52422 17.3678 1.74359 16.3636 1.74359H3.63636C2.63221 1.74359 1.81818 2.52422 1.81818 3.48718V3.92308Z"
            fill="white"
          />
          <path
            d="M2.72727 11.7692C2.72727 11.2878 3.13429 10.8974 3.63636 10.8974H10.9091C11.4112 10.8974 11.8182 11.2878 11.8182 11.7692C11.8182 12.2507 11.4112 12.641 10.9091 12.641H3.63636C3.13429 12.641 2.72727 12.2507 2.72727 11.7692Z"
            fill="white"
          />
          <path
            d="M18.1818 12.641C18.1818 12.1595 17.7748 11.7692 17.2727 11.7692C16.7707 11.7692 16.3636 12.1595 16.3636 12.641V13.5128H15.4545C14.9525 13.5128 14.5455 13.9031 14.5455 14.3846C14.5455 14.8661 14.9525 15.2564 15.4545 15.2564H16.3636V16.1282C16.3636 16.6097 16.7707 17 17.2727 17C17.7748 17 18.1818 16.6097 18.1818 16.1282V15.2564H19.0909C19.593 15.2564 20 14.8661 20 14.3846C20 13.9031 19.593 13.5128 19.0909 13.5128H18.1818V12.641Z"
            fill="white"
          />
        </svg>
        {secondaryActionLabel}
      </Button>

      <Menu
        trigger={
          <Button variant="greyy" className="px-10 py-3 w-full">
            More <ChevronRight className="h-4 w-4" />
          </Button>
        }
        items={[
          { label: "Add new expense", onClick: onAddExpense },
          { label: "Export table", onClick: () => onMore?.("export-table") },
          {
            label: "Export analytics",
            onClick: () => onMore?.("export-analytics"),
          },
        ]}
      />
    </div>
  );
}
