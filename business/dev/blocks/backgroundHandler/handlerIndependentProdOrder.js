export default function () {
  return {
    'telecom-independent-product-order': async function ({ data, id }) {
      try {
        const {
          isZtSource,
          skipCurrentProcess,
          skipValidation,
          waitTimeout,
          productInfo,
        } = data;

        // 1. 验证配置
        if (!productInfo || productInfo.length === 0) {
          throw new Error('至少需要配置一个销售品');
        }

        // 2. 中台来源数据特殊处理：过滤黄金/白金会员
        let processedProducts = [...productInfo];
        if (isZtSource) {
          processedProducts = productInfo.filter((product) => {
            const offerName = product.offerName || '';
            const isGoldMember = offerName.includes('黄金会员');
            const isPlatinumMember = offerName.includes('白金会员');

            if (isGoldMember || isPlatinumMember) {
              console.log(
                `[独立销售品订购] 中台来源数据，跳过会员产品: ${offerName}`
              );
              return false;
            }
            return true;
          });
        }

        // 3. 处理"未命中则跳过"标记
        const productsWithFlags = processedProducts.map((product) => {
          const offerCode = product.offerCode || '';
          const skipOnMiss = offerCode.includes('未命中则跳过');

          return {
            ...product,
            offerCode: offerCode
              .replace(/[(\uff08]未命中则跳过[)\uff09]/g, '')
              .trim(),
            skipOnMiss,
          };
        });

        // 4. 构建订购参数
        const orderParams = {
          isZtSource,
          skipCurrentProcess,
          skipValidation,
          waitTimeout: waitTimeout || 5,
          products: productsWithFlags,
          totalCount: productsWithFlags.length,
          timestamp: new Date().toISOString(),
        };

        // 5. 记录日志

        // 6. 实际场景中，这里应该发送消息到 content script 执行具体的浏览器操作
        // 例如：
        // const result = await this.sendMessage('executeContentScript', {
        //   name: 'telecom-independent-product-order',
        //   params: orderParams,
        // });

        // 7. 模拟返回结果
        const result = {
          success: true,
          message: '独立销售品订购配置已准备完成',
          orderParams,
          processedCount: productsWithFlags.length,
          skippedProducts: productInfo.length - productsWithFlags.length,
          products: productsWithFlags.map((p) => ({
            offerCode: p.offerCode,
            offerName: p.offerName,
            skipOnMiss: p.skipOnMiss,
            checkCount: (p.check || []).length,
            unCheckCount: (p.unCheck || []).length,
          })),
        };

        // 8. 保存到变量（如果需要）
        if (data.assignVariable && data.variableName) {
          this.setVariable(data.variableName, result);
        }

        // 9. 返回结果给下一个节点
        return {
          data: result,
          nextBlockId: this.getBlockConnections(id),
        };
      } catch (error) {
        console.error('[独立销售品订购] 处理失败:', error);
        throw new Error(`独立销售品订购失败: ${error.message}`);
      }
    },
  };
}
