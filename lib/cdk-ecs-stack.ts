import * as cdk from '@aws-cdk/core'
import * as ecs from '@aws-cdk/aws-ecs'
import * as ec2 from '@aws-cdk/aws-ec2'
import * as autoscaling from '@aws-cdk/aws-autoscaling'
import * as ecr from '@aws-cdk/aws-ecr'
import * as ecsp from '@aws-cdk/aws-ecs-patterns'
import * as events from '@aws-cdk/aws-events'


export class CdkEcsStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props)

    // claster周りの名前を指定
    const prefix = 'cdk-test-'

    const vpc = new ec2.Vpc(this, prefix + 'vpc')
    const autoScalingGroup = new autoscaling.AutoScalingGroup(this, prefix + 'asg', {
      vpc,
      instanceType: new ec2.InstanceType('t2.micro'),
      machineImage: ecs.EcsOptimizedImage.amazonLinux()
    })

    const batchName = prefix + 'batch'
    const cluster = new ecs.Cluster(this, batchName, {
      vpc,
      clusterName: batchName
    })
    cluster.addAutoScalingGroup(autoScalingGroup)

    const scheduledECS = new ecsp.ScheduledEc2Task(this, prefix + 'scheduled-task', {
      cluster,
      scheduledEc2TaskImageOptions: {
        image: ecs.ContainerImage.fromEcrRepository(ecr.Repository.fromRepositoryName(this, 'ecs-test', 'ecs-test')),
        memoryLimitMiB: 300
      },
      schedule: events.Schedule.expression('rate(2 minutes)')
    })

    //サービスの定義不要？
    new ecs.Ec2Service(this, prefix + 'service', {
      cluster: scheduledECS.cluster,
      taskDefinition: scheduledECS.taskDefinition
    })
  }
}
