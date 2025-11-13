import { BadgeDelta } from '../ui/BadgeDelta';
import { Card, CardBody } from '../ui/Card';
import Sparkline from '@/components/ui/Sparkline';

export function StatCard({
  title,
  value,
  delta,
  icon,
  className = '',
  spark,
}: {
  title: string;
  value: string | number;
  delta?: number; // +/- %
  icon?: React.ReactNode;
  className?: string;
  spark?: { data: { v: number }[]; color?: string };
}) {
  const sparkColor =
    spark?.color ??
    (typeof delta === 'number' && delta < 0 ? '#DC2626' : '#16A34A');

  return (
    <Card className={`overflow-hidden ${className}`}>
      <CardBody>
        <div className="flex flex-col-reverse lg:flex-row items-start justify-between">
          <div>
            <p className="mt-1 text-[clamp(1.5rem,2.5vw+1rem,2.25rem)] font-semibold text-[#3C3C3C]">
              {value}
            </p>
            <p className="text-base text-[#5A5A5A]">{title}</p>
          </div>
          <div className="">{icon}</div>
        </div>
        <div className="flex justify-between">
          {' '}
          {typeof delta === 'number' && (
            <p className="mt-3 text-sm font-medium text-neutral-500 flex items-center">
              <BadgeDelta value={delta} />{' '}
              <span className="ml-1">vs last month</span>
            </p>
          )}{' '}
          {spark?.data && <Sparkline data={spark.data} color={sparkColor} />}
        </div>
      </CardBody>
    </Card>
  );
}
