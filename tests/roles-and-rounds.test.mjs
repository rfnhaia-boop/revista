import test from 'node:test';
import assert from 'node:assert/strict';
import {meSchema} from '../lib/me-validation.ts';
import {projectSchema} from '../lib/project-validation.ts';

test('member actions reject privilege injection and require consent',()=>{
 const base={action:'question',title:'Como melhorar o acesso ao conhecimento?',context:'Uma comunidade local precisa compreender barreiras de acesso e participação.',importance:'A resposta pode orientar uma investigação pública e ações futuras.',consent:true};
 assert.equal(meSchema.safeParse(base).success,true);
 assert.equal(meSchema.safeParse({...base,role:'admin'}).success,false);
 assert.equal(meSchema.safeParse({...base,consent:false}).success,false);
});

test('project round accepts bounded funding structure and rejects privilege fields',()=>{
 const round={action:'round',id:crypto.randomUUID(),projectId:crypto.randomUUID(),roundNumber:1,title:'Primeira rodada',fundingModel:'all_or_nothing',minimumCents:100000,targetCents:200000,maximumCents:300000,purpose:'Formar a equipe responsável pela execução inicial.',deliverables:'Publicar cronograma, relatório e prestação de contas.',status:'ready',consent:true};
 assert.equal(projectSchema.safeParse(round).success,true);
 assert.equal(projectSchema.safeParse({...round,ownerId:'alguem'}).success,false);
});
