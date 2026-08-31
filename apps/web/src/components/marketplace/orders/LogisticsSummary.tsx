type LogisticsProps = {
  incoterm?: string | null;
  freightAmount?: number | null;
  productSubtotal?: number | null;
  unitPrice?: number | null;
  quantity?: number | null;
  destinationPincode?: string | null;
  shippingZone?: string | null;
  estimatedWeightKg?: number | null;
  shipByDate?: string | null;
  currency?: string | null;
  compact?: boolean;
};

function formatInr(n: number) {
  return `₹${n.toLocaleString('en-IN')}`;
}

export function LogisticsSummary({
  incoterm,
  freightAmount,
  productSubtotal,
  unitPrice,
  quantity,
  destinationPincode,
  shippingZone,
  estimatedWeightKg,
  shipByDate,
  currency = 'INR',
  compact = false,
}: LogisticsProps) {
  const subtotal =
    productSubtotal ??
    (unitPrice != null && quantity != null ? Number(unitPrice) * Number(quantity) : null);
  const freight = Number(freightAmount ?? 0);
  const sym = currency === 'INR' ? '₹' : `${currency} `;

  if (!incoterm && !freight && !destinationPincode && !shippingZone) {
    return null;
  }

  if (compact) {
    return (
      <p className="mt-1 text-xs text-muted-foreground">
        {incoterm ? (
          <span className="mr-2 rounded bg-orange-50 px-1.5 py-0.5 font-medium text-[#c2410c]">
            {incoterm}
          </span>
        ) : null}
        {freight > 0 ? `freight ${sym}${freight.toLocaleString('en-IN')}` : 'freight buyer arranges'}
        {shippingZone ? ` · ${shippingZone} zone` : ''}
        {destinationPincode ? ` · pin ${destinationPincode}` : ''}
      </p>
    );
  }

  return (
    <div className="mt-3 rounded-lg border border-orange-100 bg-orange-50/50 p-3 text-sm">
      <p className="font-medium text-[#c2410c]">Shipping & terms</p>
      <dl className="mt-2 grid gap-1 text-xs text-muted-foreground sm:grid-cols-2">
        {incoterm ? (
          <>
            <dt>Incoterm</dt>
            <dd className="font-medium text-foreground">{incoterm}</dd>
          </>
        ) : null}
        {subtotal != null ? (
          <>
            <dt>Product subtotal</dt>
            <dd>{formatInr(subtotal)}</dd>
          </>
        ) : null}
        <dt>Freight estimate</dt>
        <dd>{freight > 0 ? formatInr(freight) : 'Not included (buyer arranges)'}</dd>
        {destinationPincode ? (
          <>
            <dt>Destination pincode</dt>
            <dd>{destinationPincode}</dd>
          </>
        ) : null}
        {shippingZone ? (
          <>
            <dt>Zone</dt>
            <dd className="capitalize">{shippingZone}</dd>
          </>
        ) : null}
        {estimatedWeightKg != null ? (
          <>
            <dt>Est. weight</dt>
            <dd>{estimatedWeightKg} kg</dd>
          </>
        ) : null}
        {shipByDate ? (
          <>
            <dt>Ship by</dt>
            <dd>{shipByDate}</dd>
          </>
        ) : null}
      </dl>
      {subtotal != null && freight > 0 ? (
        <p className="mt-2 text-xs font-medium text-foreground">
          Order total (incl. freight): {formatInr(subtotal + freight)}
        </p>
      ) : null}
    </div>
  );
}
