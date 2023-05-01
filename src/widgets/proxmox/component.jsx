import { useTranslation } from "next-i18next";

import Container from "components/services/widget/container";
import Block from "components/services/widget/block";
import useWidgetAPI from "utils/proxy/use-widget-api";

function calcRunning(total, current) {
  return current.status === "running" ? total + 1 : total;
}

export default function Component({ service }) {
  const { t } = useTranslation();

  const { widget } = service;

  const { data: clusterData, error: clusterError } = useWidgetAPI(widget, "cluster/resources");

  if (clusterError) {
    return <Container service={service} error={clusterError} />;
  }

  if (!clusterData || !clusterData.data) {
    return (
      <Container service={service}>
        <Block label="proxmox.node" />
        <Block label="proxmox.vms" />
        <Block label="proxmox.lxc" />
        <Block label="resources.cpu" />
        <Block label="resources.ram" />
      </Container>
    );
  }

  const { data } = clusterData ;
  const nodes = data.filter(item => item.type === "node").sort((a, b) => a.node.localeCompare(b.node));

  return (
    <>
      {nodes.map(node => {
        const qemu = data.filter(item => item.type === "qemu" && item.node === node.node && item.template === 0);
        const lxc = data.filter(item => item.type === "lxc" && item.node === node.node && item.template === 0);
  
        return (
          <Container key={node.node} service={service}>
            <Block label="proxmox.node" value={t(node.node)} />
            <Block label="proxmox.vms" value={`${qemu.reduce(calcRunning, 0)} / ${qemu.length}`} />
            <Block label="proxmox.lxc" value={`${lxc.reduce(calcRunning, 0)} / ${lxc.length}`} />
            <Block label="resources.cpu" value={t("common.percent", { value: (node.cpu * 100) })} />
            <Block label="resources.mem" value={t("common.percent", { value: ((node.mem / node.maxmem) * 100) })} />
          </Container>
        );
      })}
    </>
  );
}
